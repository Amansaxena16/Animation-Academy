from django.db import IntegrityError, transaction
from django.db.models import Count
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserSerializer
from accounts.views import issue_tokens, set_refresh_cookie
from common.permissions import IsStudent
from website.models import Announcement, SiteSettings
from website.serializers import AnnouncementSerializer

from .models import Enrollment, Student
from .serializers import (
    STEPS,
    AdmissionResultSerializer,
    AdmissionSerializer,
    ApplySerializer,
    DashboardSerializer,
    MyEnrollmentSerializer,
    ProfileSerializer,
)

REGISTRATION_CLOSED = "Online registration is closed right now. Please call the institute."
EMAIL_TAKEN = "An account with this email already exists. Log in instead."


class PublicView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []


def require_registration_open():
    if not SiteSettings.load().allow_registration:
        raise PermissionDenied(REGISTRATION_CLOSED, code="registration_closed")


class AdmissionStepView(PublicView):
    """Check one step of the form before moving on. Nothing is saved."""

    throttle_scope = "admission_check"

    @extend_schema(
        request=inline_serializer(
            "AdmissionStep",
            {
                "step": serializers.ChoiceField(choices=list(STEPS)),
                "data": serializers.DictField(),
            },
        ),
        responses={
            200: inline_serializer("AdmissionStepValid", {"valid": serializers.BooleanField()})
        },
    )
    def post(self, request):
        require_registration_open()
        step = request.data.get("step")
        if step not in STEPS:
            raise serializers.ValidationError({"step": [f"Use one of: {', '.join(STEPS)}."]})
        data = request.data.get("data")
        if not isinstance(data, dict):
            raise serializers.ValidationError({"data": ["Send the step's fields as an object."]})
        STEPS[step](data=data).is_valid(raise_exception=True)
        return Response({"valid": True})


class AdmissionView(PublicView):
    """Apply online: creates the login, the student (Pending) and the enrollment (Pending),
    then signs the new student in."""

    throttle_scope = "admission"
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        request={
            "multipart/form-data": AdmissionSerializer,
            "application/json": AdmissionSerializer,
        },
        responses={
            201: AdmissionResultSerializer,
            403: OpenApiResponse(description="Registration is closed."),
        },
    )
    def post(self, request):
        require_registration_open()
        serializer = AdmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user, student, enrollment = self.create(serializer.validated_data)
        except IntegrityError as e:  # the same email submitted twice at the same moment
            raise serializers.ValidationError({"email": [EMAIL_TAKEN]}) from e

        refresh, access = issue_tokens(user)
        response = Response(
            {
                "student_code": student.code,
                "enrollment_code": enrollment.code,
                "course": {"slug": enrollment.course.slug, "name": enrollment.course.name},
                "access": access,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, refresh, user.role)
        return response

    @staticmethod
    def create(data):
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
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
            photo=data.get("photo") or "",
        )
        enrollment = Enrollment.objects.create(student=student, course=data["course"])
        return user, student, enrollment


# ---------------------------------------------------------------------------------------------
# Student portal: /me/... Only the signed-in student's own data is ever reachable here, because
# every query starts from request.user.student.


ALREADY_ENROLLED = "You've already applied for this course — find it under My Courses."


class StudentView(APIView):
    permission_classes = [IsStudent]

    def get_student(self):
        student = getattr(self.request.user, "student", None)
        if student is None:
            raise PermissionDenied(
                "There's no student record for this login. Please contact the office."
            )
        return student


class DashboardView(StudentView):
    @extend_schema(responses=DashboardSerializer)
    def get(self, request):
        student = self.get_student()
        enrollments = student.enrollments.select_related("course")
        counts = {s.lower(): 0 for s in Enrollment.Status.values}
        for row in enrollments.values("status").annotate(n=Count("id")):
            counts[row["status"].lower()] = row["n"]
        current = enrollments.filter(
            status__in=[Enrollment.Status.PENDING, Enrollment.Status.ACTIVE]
        )
        certified = enrollments.exclude(certificate_code=None).order_by("-certificate_issued_on")
        upcoming = Announcement.objects.filter(
            published=True,
            date__gte=timezone.localdate(),
            category__in=[Announcement.Category.HOLIDAY, Announcement.Category.EVENT],
        ).order_by("date")[:3]
        data = {
            "counts": {
                "pending": counts["pending"],
                "active": counts["active"],
                "completed": counts["completed"],
                "certificates": certified.count(),
            },
            "current": MyEnrollmentSerializer(current, many=True).data,
            "certificates": MyEnrollmentSerializer(certified[:3], many=True).data,
            "upcoming": AnnouncementSerializer(upcoming, many=True).data,
        }
        return Response(data)


class ProfileView(StudentView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(responses=ProfileSerializer)
    def get(self, request):
        return Response(ProfileSerializer(self.get_student(), context={"request": request}).data)

    @extend_schema(
        request={"application/json": ProfileSerializer, "multipart/form-data": ProfileSerializer},
        responses=ProfileSerializer,
    )
    def patch(self, request):
        serializer = ProfileSerializer(
            self.get_student(), data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyEnrollmentsView(StudentView):
    throttle_scope = "apply"

    def get_throttles(self):
        # Only applying is throttled; reading the list isn't.
        return super().get_throttles() if self.request.method == "POST" else []

    @extend_schema(
        parameters=[OpenApiParameter("status", enum=Enrollment.Status.values)],
        responses=MyEnrollmentSerializer(many=True),
    )
    def get(self, request):
        items = self.get_student().enrollments.select_related("course")
        wanted = request.query_params.get("status")
        if wanted:
            if wanted not in Enrollment.Status.values:
                raise serializers.ValidationError(
                    {"status": [f"Use one of: {', '.join(Enrollment.Status.values)}."]}
                )
            items = items.filter(status=wanted)
        return Response(MyEnrollmentSerializer(items, many=True).data)

    @extend_schema(
        request=ApplySerializer,
        responses={
            201: MyEnrollmentSerializer,
            409: OpenApiResponse(description="Already applied for this course."),
        },
    )
    def post(self, request):
        require_registration_open()
        student = self.get_student()
        serializer = ApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.validated_data["course"]

        live = student.enrollments.filter(course=course).exclude(status=Enrollment.Status.CANCELLED)
        if live.exists():
            return already_enrolled()
        try:
            with transaction.atomic():
                enrollment = Enrollment.objects.create(student=student, course=course)
        except IntegrityError:  # a double click that got past the check above
            return already_enrolled()
        return Response(MyEnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)


def already_enrolled():
    return Response(
        {"detail": ALREADY_ENROLLED, "errors": {}, "code": "already_enrolled"},
        status=status.HTTP_409_CONFLICT,
    )
