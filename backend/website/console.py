"""Admin console API for public content: /api/v1/admin/... (staff only).

Every save goes through the models, so website/signals.py refreshes the public site."""

from django.db.models import Count, Q, TextField
from django.db.models.functions import Cast
from django.utils.text import slugify
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from common.images import reencode_image
from common.permissions import IsAdmin

from .models import Announcement, ContactMessage, Course, SiteSettings, validate_syllabus

COURSE_IMAGE_BYTES = 5 * 1024 * 1024
COURSE_IMAGE_SIZE = (1600, 1000)


class AdminView:
    permission_classes = [IsAdmin]


def bool_param(request, name):
    value = request.query_params.get(name)
    return None if value is None else value.lower() in {"1", "true", "yes"}


# --- Courses --------------------------------------------------------------------------------


class SyllabusGroupInput(serializers.Serializer):
    title = serializers.CharField(allow_blank=True, required=False, default="", max_length=120)
    duration = serializers.CharField(allow_blank=True, required=False, default="", max_length=40)
    tools = serializers.CharField(allow_blank=True, required=False, default="", max_length=200)
    items = serializers.ListField(
        child=serializers.CharField(allow_blank=True, max_length=200), max_length=60
    )


class AdminCourseSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, max_length=50)
    # A list (not a nested serializer), so ModelSerializer saves it straight into the JSON field.
    syllabus = serializers.ListField(child=SyllabusGroupInput())
    total_fee = serializers.IntegerField(read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(read_only=True, allow_null=True)

    class Meta:
        model = Course
        fields = [
            "slug",
            "name",
            "kind",
            "category",
            "level",
            "status",
            "duration_label",
            "months",
            "monthly_fee",
            "first_month_fee",
            "total_fee",
            "description",
            "syllabus",
            "image",
            "featured",
            "tag",
            "schedule",
            "next_batch_start",
            "order",
            "enrollment_count",
            "updated_at",
        ]
        read_only_fields = ["total_fee", "enrollment_count", "image", "updated_at"]
        # A ₹0 fee is almost always a typo; the website would show "₹0/month".
        extra_kwargs = {
            "monthly_fee": {"min_value": 1},
            "first_month_fee": {"min_value": 1},
        }

    def validate_slug(self, value):
        taken = Course.objects.filter(slug=value)
        if self.instance:
            taken = taken.exclude(pk=self.instance.pk)
        if taken.exists():
            raise serializers.ValidationError("Another course already uses this web address.")
        return value

    def validate_syllabus(self, value):
        groups = [
            {
                "title": g.get("title", "").strip(),
                "duration": g.get("duration", "").strip(),
                "tools": g.get("tools", "").strip(),
                "items": [i.strip() for i in g.get("items", []) if i.strip()],
            }
            for g in value
        ]
        try:
            validate_syllabus(groups)
        except Exception as e:
            raise serializers.ValidationError(getattr(e, "messages", [str(e)])) from e
        return groups

    def validate(self, attrs):
        months = attrs.get("months", getattr(self.instance, "months", 1))
        first = attrs.get("first_month_fee", getattr(self.instance, "first_month_fee", None))
        if first is not None and months < 2:
            raise serializers.ValidationError(
                {"first_month_fee": ["A different first-month fee needs a course of 2+ months."]}
            )
        if not self.instance and not attrs.get("slug"):
            base = slugify(attrs["name"].replace("—", " "))[:45] or "course"
            slug, n = base, 2
            while Course.objects.filter(slug=slug).exists():
                slug, n = f"{base}-{n}", n + 1
            attrs["slug"] = slug
        return attrs


def courses_with_counts():
    return Course.objects.annotate(enrollment_count=Count("enrollments"))


class AdminCourseListView(AdminView, generics.ListCreateAPIView):
    serializer_class = AdminCourseSerializer
    pagination_class = None  # a small catalogue

    @extend_schema(
        parameters=[
            OpenApiParameter("status", enum=Course.Status.values),
            OpenApiParameter("category", enum=Course.Category.values),
            OpenApiParameter("q", str),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = courses_with_counts().order_by("order", "name")
        params = self.request.query_params
        if params.get("status"):
            items = items.filter(status=params["status"])
        if params.get("category"):
            items = items.filter(category=params["category"])
        if q := params.get("q", "").strip():
            items = items.annotate(text=Cast("syllabus", TextField())).filter(
                Q(name__icontains=q) | Q(description__icontains=q) | Q(text__icontains=q)
            )
        return items


class AdminCourseDetailView(AdminView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminCourseSerializer
    lookup_field = "slug"
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        return courses_with_counts()

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.enrollment_count:
            return Response(
                {
                    "detail": "Students have applied for this course, so it can't be deleted. "
                    "Set it to Draft to hide it from the website instead.",
                    "errors": {},
                    "code": "has_enrollments",
                },
                status=status.HTTP_409_CONFLICT,
            )
        if course.image:
            course.image.delete(save=False)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CourseImageSerializer(serializers.Serializer):
    image = serializers.ImageField(allow_null=True)


class AdminCourseImageView(AdminView, APIView):
    """Upload (multipart `image`) or remove (`image: null`) a course's artwork."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(request=CourseImageSerializer, responses=AdminCourseSerializer)
    def post(self, request, slug):
        course = generics.get_object_or_404(courses_with_counts(), slug=slug)
        data = CourseImageSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        upload = data.validated_data["image"]
        if course.image:
            course.image.delete(save=False)
        course.image = (
            reencode_image(upload, max_bytes=COURSE_IMAGE_BYTES, max_size=COURSE_IMAGE_SIZE)
            if upload
            else ""
        )
        course.save()
        return Response(AdminCourseSerializer(course, context={"request": request}).data)


# --- Announcements --------------------------------------------------------------------------


class AdminAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "text", "category", "date", "published", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class AdminAnnouncementListView(AdminView, generics.ListCreateAPIView):
    serializer_class = AdminAnnouncementSerializer

    @extend_schema(parameters=[OpenApiParameter("published", bool)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = Announcement.objects.order_by("-date", "-created_at")
        published = bool_param(self.request, "published")
        return items if published is None else items.filter(published=published)


class AdminAnnouncementDetailView(AdminView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminAnnouncementSerializer
    queryset = Announcement.objects.all()
    http_method_names = ["get", "patch", "delete"]


# --- Site settings --------------------------------------------------------------------------


class AdminSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        exclude = ["id"]
        read_only_fields = ["updated_at"]

    def validate_phones(self, value):
        phones = [p.strip() for p in value.split(",") if p.strip()]
        for p in phones:
            if not 6 <= len("".join(ch for ch in p if ch.isdigit())) <= 12:
                raise serializers.ValidationError(f"“{p}” doesn't look like a phone number.")
        return ", ".join(phones)


class AdminSiteView(AdminView, APIView):
    @extend_schema(responses=AdminSiteSerializer)
    def get(self, request):
        return Response(AdminSiteSerializer(SiteSettings.load()).data)

    @extend_schema(request=AdminSiteSerializer, responses=AdminSiteSerializer)
    def patch(self, request):
        serializer = AdminSiteSerializer(SiteSettings.load(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# --- Contact messages -----------------------------------------------------------------------


class AdminContactMessageSerializer(serializers.ModelSerializer):
    course = serializers.CharField(source="course.name", read_only=True, default=None)

    class Meta:
        model = ContactMessage
        fields = ["id", "name", "phone", "email", "course", "message", "handled", "created_at"]
        read_only_fields = ["id", "name", "phone", "email", "course", "message", "created_at"]


class AdminContactMessageListView(AdminView, generics.ListAPIView):
    serializer_class = AdminContactMessageSerializer

    @extend_schema(parameters=[OpenApiParameter("handled", bool)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = ContactMessage.objects.select_related("course").order_by("handled", "-created_at")
        handled = bool_param(self.request, "handled")
        return items if handled is None else items.filter(handled=handled)


class AdminContactMessageDetailView(AdminView, generics.UpdateAPIView):
    serializer_class = AdminContactMessageSerializer
    queryset = ContactMessage.objects.all()
    http_method_names = ["patch"]
