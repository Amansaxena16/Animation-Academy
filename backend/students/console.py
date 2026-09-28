"""Admin console API for students, enrollments and certificates: /api/v1/admin/... (staff only)."""

import datetime

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.crypto import get_random_string
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_field,
    inline_serializer,
)
from rest_framework import generics, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.views import blacklist_all
from common.permissions import IsAdmin
from website.models import ContactMessage, Course
from website.serializers import AnnouncementSerializer

from .models import Enrollment, Student
from .serializers import EducationStep, PersonalStep, ProfileSerializer, normalise_mobile
from .services import certificate_data, certified, issue_certificate
from .views import pdf_response

TEMP_PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O, 1/l/I


def temporary_password() -> str:
    return get_random_string(12, TEMP_PASSWORD_CHARS)


class AdminView:
    permission_classes = [IsAdmin]


def conflict(detail, code):
    return Response({"detail": detail, "errors": {}, "code": code}, status=status.HTTP_409_CONFLICT)


# --- Shared pieces --------------------------------------------------------------------------


class AdminStudentRefSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(read_only=True, allow_null=True)

    class Meta:
        model = Student
        fields = ["code", "name", "mobile", "photo", "status"]
        read_only_fields = fields


class AdminCourseRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "slug",
            "name",
            "kind",
            "duration_label",
            "months",
            "monthly_fee",
            "first_month_fee",
        ]
        read_only_fields = fields


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    student = AdminStudentRefSerializer(read_only=True)
    course = AdminCourseRefSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "code",
            "status",
            "student",
            "course",
            "applied_at",
            "approved_at",
            "completed_at",
            "note",
            "certificate_code",
            "certificate_issued_on",
        ]
        read_only_fields = fields


def enrollments():
    return Enrollment.objects.select_related("student", "course")


# --- Dashboard ------------------------------------------------------------------------------


class AdminDashboardSerializer(serializers.Serializer):
    counts = inline_serializer(
        "AdminDashboardCounts",
        {
            "students": serializers.IntegerField(help_text="Not inactive."),
            "pending_admissions": serializers.IntegerField(),
            "active_enrollments": serializers.IntegerField(),
            "certificates": serializers.IntegerField(),
            "admissions_this_month": serializers.IntegerField(),
            "unhandled_messages": serializers.IntegerField(),
        },
    )
    pending = AdminEnrollmentSerializer(many=True, help_text="The 5 oldest waiting.")
    recent_messages = inline_serializer(
        "AdminDashboardMessage",
        {
            "id": serializers.IntegerField(),
            "name": serializers.CharField(),
            "phone": serializers.CharField(),
            "message": serializers.CharField(),
            "created_at": serializers.DateTimeField(),
        },
        many=True,
    )
    upcoming = AnnouncementSerializer(many=True)


class AdminDashboardView(AdminView, APIView):
    @extend_schema(responses=AdminDashboardSerializer)
    def get(self, request):
        from website.models import Announcement

        now = timezone.localtime()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        by_status = dict(Enrollment.objects.values_list("status").annotate(n=Count("id")))
        messages = ContactMessage.objects.filter(handled=False).order_by("-created_at")
        data = {
            "counts": {
                "students": Student.objects.exclude(status=Student.Status.INACTIVE).count(),
                "pending_admissions": by_status.get(Enrollment.Status.PENDING, 0),
                "active_enrollments": by_status.get(Enrollment.Status.ACTIVE, 0),
                "certificates": Enrollment.objects.exclude(certificate_code=None).count(),
                "admissions_this_month": Enrollment.objects.filter(
                    applied_at__gte=month_start
                ).count(),
                "unhandled_messages": messages.count(),
            },
            "pending": AdminEnrollmentSerializer(
                enrollments().filter(status=Enrollment.Status.PENDING).order_by("applied_at")[:5],
                many=True,
                context={"request": request},
            ).data,
            "recent_messages": [
                {
                    "id": m.id,
                    "name": m.name,
                    "phone": m.phone,
                    "message": m.message,
                    "created_at": m.created_at,
                }
                for m in messages[:5]
            ],
            "upcoming": AnnouncementSerializer(
                Announcement.objects.filter(published=True, date__gte=now.date()).order_by("date")[
                    :4
                ],
                many=True,
            ).data,
        }
        return Response(data)


# --- Enrollments ----------------------------------------------------------------------------


class AdminEnrollmentCreateSerializer(serializers.Serializer):
    """The office enrolling a student in person (e.g. a walk-in who has already paid)."""

    student = serializers.SlugRelatedField(slug_field="code", queryset=Student.objects.all())
    course = serializers.SlugRelatedField(slug_field="slug", queryset=Course.objects.all())
    status = serializers.ChoiceField(
        choices=[Enrollment.Status.PENDING, Enrollment.Status.ACTIVE],
        default=Enrollment.Status.ACTIVE,
    )


class AdminEnrollmentListView(AdminView, generics.ListCreateAPIView):
    serializer_class = AdminEnrollmentSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", enum=Enrollment.Status.values),
            OpenApiParameter("course", str, description="Course slug"),
            OpenApiParameter("q", str, description="Student name or code, or enrollment code"),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = enrollments()
        params = self.request.query_params
        wanted = params.get("status")
        if wanted:
            if wanted not in Enrollment.Status.values:
                raise ValidationError(
                    {"status": [f"Use one of: {', '.join(Enrollment.Status.values)}."]}
                )
            items = items.filter(status=wanted)
            # The waiting list is worked oldest first; everything else newest first.
            if wanted == Enrollment.Status.PENDING:
                return items.order_by("applied_at")
        if params.get("course"):
            items = items.filter(course__slug=params["course"])
        if q := params.get("q", "").strip():
            items = items.filter(
                Q(student__name__icontains=q) | Q(student__code__iexact=q) | Q(code__iexact=q)
            )
        return items.order_by("-applied_at")

    @extend_schema(
        request=AdminEnrollmentCreateSerializer,
        responses={
            201: AdminEnrollmentSerializer,
            409: OpenApiResponse(description="Already enrolled."),
        },
    )
    def post(self, request):
        data = AdminEnrollmentCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        student, course = data.validated_data["student"], data.validated_data["course"]
        wanted = data.validated_data["status"]
        try:
            with transaction.atomic():
                enrollment = Enrollment.objects.create(
                    student=student,
                    course=course,
                    status=wanted,
                    approved_at=timezone.now() if wanted == Enrollment.Status.ACTIVE else None,
                )
                if wanted == Enrollment.Status.ACTIVE and student.status == Student.Status.PENDING:
                    student.status = Student.Status.ACTIVE
                    student.save(update_fields=["status", "updated_at"])
        except IntegrityError:
            return conflict(
                f"{student.name} is already enrolled in {course.name}.", "already_enrolled"
            )
        return Response(
            AdminEnrollmentSerializer(enrollment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class EnrollmentAction(AdminView, APIView):
    def get_enrollment(self, code):
        return generics.get_object_or_404(enrollments(), code=code.upper())

    def done(self, request, enrollment):
        enrollment.refresh_from_db()
        return Response(AdminEnrollmentSerializer(enrollment, context={"request": request}).data)


class AdminEnrollmentDetailView(EnrollmentAction):
    @extend_schema(responses=AdminEnrollmentSerializer)
    def get(self, request, code):
        return Response(
            AdminEnrollmentSerializer(self.get_enrollment(code), context={"request": request}).data
        )


class AdminEnrollmentApproveView(EnrollmentAction):
    """Pending → Active. A pending student becomes Active too."""

    @extend_schema(request=None, responses=AdminEnrollmentSerializer)
    def post(self, request, code):
        with transaction.atomic():
            enrollment = Enrollment.objects.select_for_update().get(pk=self.get_enrollment(code).pk)
            if enrollment.status != Enrollment.Status.PENDING:
                return conflict(
                    "Only a pending admission can be approved "
                    f"(this one is {enrollment.status.lower()}).",
                    "not_pending",
                )
            enrollment.status = Enrollment.Status.ACTIVE
            enrollment.approved_at = timezone.now()
            enrollment.save(update_fields=["status", "approved_at"])
            student = enrollment.student
            if student.status == Student.Status.PENDING:
                student.status = Student.Status.ACTIVE
                student.save(update_fields=["status", "updated_at"])
        return self.done(request, enrollment)


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=250, required=False, allow_blank=True, default="")


class AdminEnrollmentRejectView(EnrollmentAction):
    """Pending or Active → Cancelled (a rejected admission, or a student who left)."""

    @extend_schema(request=RejectSerializer, responses=AdminEnrollmentSerializer)
    def post(self, request, code):
        body = RejectSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        with transaction.atomic():
            enrollment = Enrollment.objects.select_for_update().get(pk=self.get_enrollment(code).pk)
            if enrollment.status not in (Enrollment.Status.PENDING, Enrollment.Status.ACTIVE):
                return conflict(
                    f"A {enrollment.status.lower()} enrollment can't be cancelled.",
                    "not_cancellable",
                )
            enrollment.status = Enrollment.Status.CANCELLED
            enrollment.note = body.validated_data["reason"].strip()
            enrollment.save(update_fields=["status", "note"])
        return self.done(request, enrollment)


class AdminEnrollmentCompleteView(EnrollmentAction):
    """Active → Completed, and the certificate is issued."""

    @extend_schema(request=None, responses=AdminEnrollmentSerializer)
    def post(self, request, code):
        from django.core.exceptions import ValidationError as DjangoValidationError

        enrollment = self.get_enrollment(code)
        try:
            issue_certificate(enrollment, by=request.user)
        except DjangoValidationError as e:
            return conflict(e.messages[0], "not_active")
        return self.done(request, enrollment)


# --- Students -------------------------------------------------------------------------------


class AdminStudentListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    photo = serializers.ImageField(read_only=True, allow_null=True)
    enrollment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Student
        fields = [
            "code",
            "name",
            "email",
            "mobile",
            "city",
            "status",
            "photo",
            "joined_at",
            "enrollment_count",
        ]
        read_only_fields = fields


class StudentEnrollmentSerializer(serializers.Serializer):
    code = serializers.CharField()
    status = serializers.CharField()
    course = inline_serializer(
        "StudentEnrollmentCourse",
        {"slug": serializers.CharField(), "name": serializers.CharField()},
    )
    applied_at = serializers.DateTimeField()
    certificate_code = serializers.CharField(allow_null=True)


class AdminStudentSerializer(ProfileSerializer):
    """Full record. Unlike the student's own profile, staff can change identity fields, the
    login email and the status (Inactive also blocks the login)."""

    email = serializers.EmailField(source="user.email", required=False, max_length=254)
    enrollments = serializers.SerializerMethodField()

    class Meta(ProfileSerializer.Meta):
        fields = [*ProfileSerializer.Meta.fields, "enrollments"]
        read_only_fields = ["code", "joined_at", "enrollments"]

    validate_name = PersonalStep.validate_name
    validate_father_name = PersonalStep.validate_father_name
    validate_dob = PersonalStep.validate_dob

    @extend_schema_field(StudentEnrollmentSerializer(many=True))
    def get_enrollments(self, obj):
        items = obj.enrollments.select_related("course").order_by("-applied_at")
        return [
            {
                "code": e.code,
                "status": e.status,
                "course": {"slug": e.course.slug, "name": e.course.name},
                "applied_at": e.applied_at,
                "certificate_code": e.certificate_code,
            }
            for e in items
        ]

    def validate_email(self, value):
        value = value.strip().lower()
        taken = User.objects.filter(email=value).exclude(
            pk=self.instance.user_id if self.instance else None
        )
        if taken.exists():
            raise serializers.ValidationError("Another account already uses this email.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        student = super().update(instance, validated_data)
        user = student.user
        changed = []
        if "email" in user_data and user_data["email"] != user.email:
            user.email = user_data["email"]
            changed.append("email")
        if user.full_name != student.name:
            user.full_name = student.name
            changed.append("full_name")
        active = student.status != Student.Status.INACTIVE
        if user.is_active != active:
            user.is_active = active
            changed.append("is_active")
            if not active:
                blacklist_all(user)  # sign them out everywhere
        if changed:
            user.save(update_fields=changed)
        return student


class AdminStudentCreateSerializer(PersonalStep, EducationStep):
    """Adding a student at the office. A temporary password is generated and shown once."""

    email = serializers.EmailField(max_length=254)
    employment = serializers.ChoiceField(choices=Student.Employment.choices)
    course = serializers.SlugRelatedField(
        slug_field="slug", queryset=Course.objects.all(), required=False, allow_null=True
    )

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value


def students_with_counts():
    return Student.objects.select_related("user").annotate(enrollment_count=Count("enrollments"))


class AdminStudentListView(AdminView, generics.ListCreateAPIView):
    serializer_class = AdminStudentListSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("status", enum=Student.Status.values),
            OpenApiParameter("q", str, description="Name, student code, mobile or email"),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = students_with_counts().order_by("-joined_at")
        params = self.request.query_params
        if params.get("status"):
            if params["status"] not in Student.Status.values:
                raise ValidationError(
                    {"status": [f"Use one of: {', '.join(Student.Status.values)}."]}
                )
            items = items.filter(status=params["status"])
        if q := params.get("q", "").strip():
            digits = normalise_mobile(q)
            items = items.filter(
                Q(name__icontains=q)
                | Q(code__iexact=q)
                | Q(user__email__icontains=q)
                | (Q(mobile__contains=digits) if len(digits) >= 4 else Q(pk__in=[]))
            )
        return items

    @extend_schema(
        request=AdminStudentCreateSerializer,
        responses={
            201: inline_serializer(
                "AdminStudentCreated",
                {
                    "student": AdminStudentSerializer(),
                    "temporary_password": serializers.CharField(),
                },
            )
        },
    )
    def post(self, request):
        body = AdminStudentCreateSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        data = body.validated_data
        password = temporary_password()
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=data["email"],
                    password=password,
                    full_name=data["name"],
                    role=User.Role.STUDENT,
                )
                student = Student.objects.create(
                    user=user,
                    name=data["name"],
                    father_name=data["father_name"],
                    dob=data["dob"],
                    gender=data.get("gender", ""),
                    address=data["address"],
                    pincode=data["pincode"],
                    city=data["city"],
                    mobile=data["mobile"],
                    phone=data["phone"],
                    employment=data["employment"],
                    qualifications=data["qualifications"],
                    # Added at the office, so already confirmed.
                    status=Student.Status.ACTIVE,
                )
                if data.get("course"):
                    Enrollment.objects.create(
                        student=student,
                        course=data["course"],
                        status=Enrollment.Status.ACTIVE,
                        approved_at=timezone.now(),
                    )
        except IntegrityError as e:
            raise ValidationError({"email": ["An account with this email already exists."]}) from e
        return Response(
            {
                "student": AdminStudentSerializer(student, context={"request": request}).data,
                "temporary_password": password,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminStudentDetailView(AdminView, APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_student(self, code):
        return generics.get_object_or_404(Student.objects.select_related("user"), code=code.upper())

    @extend_schema(responses=AdminStudentSerializer)
    def get(self, request, code):
        return Response(
            AdminStudentSerializer(self.get_student(code), context={"request": request}).data
        )

    @extend_schema(request=AdminStudentSerializer, responses=AdminStudentSerializer)
    def patch(self, request, code):
        serializer = AdminStudentSerializer(
            self.get_student(code), data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(request=None, responses={204: None})
    def delete(self, request, code):
        """Deactivate (records are kept): status Inactive, login blocked, signed out."""
        student = self.get_student(code)
        serializer = AdminStudentSerializer(
            student,
            data={"status": Student.Status.INACTIVE},
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminStudentResetPasswordView(AdminView, APIView):
    @extend_schema(
        request=None,
        responses=inline_serializer(
            "TemporaryPassword", {"temporary_password": serializers.CharField()}
        ),
    )
    def post(self, request, code):
        student = generics.get_object_or_404(
            Student.objects.select_related("user"), code=code.upper()
        )
        password = temporary_password()
        student.user.set_password(password)
        student.user.save(update_fields=["password"])
        blacklist_all(student.user)
        return Response({"temporary_password": password})


# --- Certificates ---------------------------------------------------------------------------


class AdminCertificateSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="certificate_code")
    issued_on = serializers.DateField(source="certificate_issued_on")
    student = AdminStudentRefSerializer()
    course = AdminCourseRefSerializer()
    issued_by = serializers.CharField(
        source="certificate_issued_by.display_name", default="", allow_null=True
    )

    class Meta:
        model = Enrollment
        fields = ["code", "issued_on", "student", "course", "issued_by"]
        read_only_fields = fields


class AdminCertificateListView(AdminView, generics.ListAPIView):
    serializer_class = AdminCertificateSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("course", str, description="Course slug"),
            OpenApiParameter("year", int),
            OpenApiParameter("q", str, description="Certificate code, student name or code"),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        items = (
            certified()
            .select_related("certificate_issued_by")
            .order_by("-certificate_issued_on", "-pk")
        )
        params = self.request.query_params
        if params.get("course"):
            items = items.filter(course__slug=params["course"])
        if params.get("year"):
            try:
                year = int(params["year"])
            except ValueError as e:
                raise ValidationError({"year": ["Enter a year, e.g. 2026."]}) from e
            items = items.filter(
                certificate_issued_on__gte=datetime.date(year, 1, 1),
                certificate_issued_on__lte=datetime.date(year, 12, 31),
            )
        if q := params.get("q", "").strip():
            items = items.filter(
                Q(certificate_code__iexact=q)
                | Q(student__name__icontains=q)
                | Q(student__code__iexact=q)
            )
        return items


class AdminCertificatePDFView(AdminView, APIView):
    @extend_schema(responses={(200, "application/pdf"): bytes})
    def get(self, request, code):
        enrollment = generics.get_object_or_404(certified(), certificate_code=code.upper())
        return pdf_response(certificate_data(enrollment))
