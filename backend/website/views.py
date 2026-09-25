from django.db.models import Case, Count, F, Value, When
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import generics, serializers, status
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import CourseFilter
from .models import Announcement, Course, SiteSettings
from .serializers import (
    AnnouncementSerializer,
    CategorySerializer,
    ContactSerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    SiteSerializer,
)


class PublicView:
    """Public endpoints: no authentication, so a stale token can never turn them into a 401."""

    permission_classes = [AllowAny]
    authentication_classes = []


def published():
    return Course.objects.filter(status=Course.Status.PUBLISHED)


class CourseListView(PublicView, generics.ListAPIView):
    """Published courses. The catalogue is small, so it's one unpaginated list."""

    serializer_class = CourseListSerializer
    pagination_class = None
    filterset_class = CourseFilter
    # `q` in CourseFilter replaces the global SearchFilter (it also searches the syllabus).
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["order", "monthly_fee", "name", "months"]
    ordering = ["order", "name"]

    def get_queryset(self):
        return published()


class CourseDetailView(PublicView, generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return published()


class CategoryListView(PublicView, APIView):
    """Every category, with how many published courses it has (for the filter chips)."""

    @extend_schema(responses=CategorySerializer(many=True))
    def get(self, request):
        counts = dict(published().values_list("category").annotate(n=Count("id")))
        data = [
            {"value": value, "label": label, "count": counts.get(value, 0)}
            for value, label in Course.Category.choices
        ]
        return Response(CategorySerializer(data, many=True).data)


class SiteView(PublicView, APIView):
    @extend_schema(responses=SiteSerializer)
    def get(self, request):
        return Response(SiteSerializer(SiteSettings.load()).data)


class AnnouncementQuery(serializers.Serializer):
    category = serializers.ChoiceField(choices=Announcement.Category.choices, required=False)
    upcoming = serializers.BooleanField(required=False, default=False)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50)


class AnnouncementListView(PublicView, APIView):
    """Published announcements as a notice board orders them: upcoming (today onwards) soonest
    first, then past ones newest first. `upcoming=true` keeps only upcoming holidays and events."""

    @extend_schema(
        parameters=[
            OpenApiParameter("category", enum=Announcement.Category.values),
            OpenApiParameter("upcoming", bool),
            OpenApiParameter("limit", int, description="1–50"),
        ],
        responses=AnnouncementSerializer(many=True),
    )
    def get(self, request):
        query = AnnouncementQuery(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        today = timezone.localdate()
        items = Announcement.objects.filter(published=True).order_by(
            Case(When(date__gte=today, then=Value(0)), default=Value(1)),  # upcoming first
            Case(When(date__gte=today, then=F("date"))),  # upcoming: soonest first
            "-date",  # past: newest first
            "-created_at",
        )
        if params.get("category"):
            items = items.filter(category=params["category"])
        if params["upcoming"]:
            items = items.filter(
                date__gte=today,
                category__in=[Announcement.Category.HOLIDAY, Announcement.Category.EVENT],
            )
        if params.get("limit"):
            items = items[: params["limit"]]
        return Response(AnnouncementSerializer(items, many=True).data)


class ContactView(PublicView, APIView):
    throttle_scope = "contact"
    SENT = "Message sent. Our counsellor will call you within one working day."

    @extend_schema(
        request=ContactSerializer,
        responses={201: inline_serializer("ContactSent", {"detail": serializers.CharField()})},
    )
    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        honeypot = serializer.validated_data.pop("website", "")
        if not honeypot:  # a bot gets the same answer, but nothing is saved
            serializer.save()
        return Response({"detail": self.SENT}, status=status.HTTP_201_CREATED)
