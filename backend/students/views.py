from django.db import IntegrityError, transaction
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserSerializer
from accounts.views import issue_tokens, set_refresh_cookie
from website.models import SiteSettings

from .models import Enrollment, Student
from .serializers import STEPS, AdmissionResultSerializer, AdmissionSerializer

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
