"""Student details as on the paper IOCSGT admission form (PROJECT_GUIDE §8).

Admissions are made by the office in the admin console; the rules below are shared by the
console's student form and the student's own profile."""

import json
import re

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from common.images import reencode_image
from website.models import Course
from website.serializers import AnnouncementSerializer

from .models import Enrollment, Student, validate_qualifications

MAX_PHOTO_BYTES = 2 * 1024 * 1024
PHOTO_SIZE = (800, 800)


def normalise_mobile(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits


class JSONStringField(serializers.JSONField):
    """Accepts real JSON or, from multipart forms, a JSON-encoded string."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except ValueError:
                self.fail("invalid")
        return super().to_internal_value(data)


class PersonalStep(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    father_name = serializers.CharField(max_length=100)
    dob = serializers.DateField(error_messages={"invalid": "Enter your date of birth."})
    gender = serializers.ChoiceField(
        choices=Student.Gender.choices, required=False, allow_blank=True
    )
    address = serializers.CharField(max_length=250)
    pincode = serializers.CharField(max_length=10)
    city = serializers.CharField(max_length=60, required=False, default="Kanpur")
    mobile = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    def validate_name(self, value):
        value = " ".join(value.split())
        if len(value) < 3 or not re.fullmatch(r"[A-Za-z .']+", value):
            raise serializers.ValidationError(
                "Enter your full name in capitals, as it should appear on the certificate."
            )
        return value.upper()

    def validate_father_name(self, value):
        value = " ".join(value.split())
        if len(value) < 3:
            raise serializers.ValidationError("Father's name is required.")
        return value.upper()

    def validate_dob(self, value):
        today = timezone.localdate()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if not 10 <= age <= 80:
            raise serializers.ValidationError("Check your date of birth.")
        return value

    def validate_address(self, value):
        value = " ".join(value.split())
        if len(value) < 5:
            raise serializers.ValidationError("Address is required.")
        return value

    def validate_pincode(self, value):
        value = value.strip()
        if not re.fullmatch(r"[1-9]\d{5}", value):
            raise serializers.ValidationError("Enter a 6-digit pincode, e.g. 208012.")
        return value

    def validate_city(self, value):
        return " ".join(value.split()) or "Kanpur"

    def validate_mobile(self, value):
        digits = normalise_mobile(value)
        if not re.fullmatch(r"[6-9]\d{9}", digits):
            raise serializers.ValidationError("Enter a 10-digit mobile number.")
        return digits

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value)
        if value and not 6 <= len(digits) <= 12:
            raise serializers.ValidationError("Enter a valid phone number, or leave it empty.")
        return digits


class EducationStep(serializers.Serializer):
    qualifications = JSONStringField()

    def validate_qualifications(self, value):
        # Trim every cell first so " 2020 " counts as filled in.
        if isinstance(value, list):
            value = [
                (
                    {k: v.strip() if isinstance(v, str) else v for k, v in row.items()}
                    if isinstance(row, dict)
                    else row
                )
                for row in value
            ]
        try:
            validate_qualifications(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages)) from e
        return value


def validate_photo(photo):
    """An optional photo: JPEG or PNG, up to 2 MB, re-encoded and scaled down."""
    if photo is None:
        return None
    return reencode_image(photo, max_bytes=MAX_PHOTO_BYTES, max_size=PHOTO_SIZE)


# ---------------------------------------------------------------------------------------------
# Student portal (/me/...). Validation is shared with the admin console's student form.


class ProfileSerializer(serializers.ModelSerializer):
    """What a student sees and edits. Identity (name, father's name, date of birth), the code and
    the status are read-only: the office changes those, because they print on certificates."""

    email = serializers.EmailField(source="user.email", read_only=True)
    # Wider than the model columns: "+91 99580 11274" is accepted and normalised to 10 digits.
    mobile = serializers.CharField(max_length=20, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    pincode = serializers.CharField(max_length=10, required=False)
    qualifications = JSONStringField()
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = [
            "code",
            "status",
            "email",
            "name",
            "father_name",
            "dob",
            "gender",
            "mobile",
            "phone",
            "address",
            "pincode",
            "city",
            "state",
            "country",
            "employment",
            "qualifications",
            "photo",
            "joined_at",
        ]
        read_only_fields = ["code", "status", "email", "name", "father_name", "dob", "joined_at"]

    validate_mobile = PersonalStep.validate_mobile
    validate_phone = PersonalStep.validate_phone
    validate_pincode = PersonalStep.validate_pincode
    validate_address = PersonalStep.validate_address
    validate_city = PersonalStep.validate_city
    validate_qualifications = EducationStep.validate_qualifications

    def validate_photo(self, photo):
        return validate_photo(photo)

    def validate_state(self, value):
        return " ".join(value.split()) or "Uttar Pradesh"

    def validate_country(self, value):
        return " ".join(value.split()) or "India"

    def update(self, instance, validated_data):
        if "photo" in validated_data and validated_data["photo"] is None:
            instance.photo.delete(save=False)  # "photo": null removes it
            validated_data["photo"] = ""
        elif validated_data.get("photo") and instance.photo:
            instance.photo.delete(save=False)  # replace: don't leave the old file behind
        return super().update(instance, validated_data)


class EnrollmentCourseSerializer(serializers.ModelSerializer):
    total_fee = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "slug",
            "name",
            "kind",
            "category",
            "duration_label",
            "months",
            "monthly_fee",
            "first_month_fee",
            "total_fee",
            "schedule",
            "next_batch_start",
        ]
        read_only_fields = fields


class MyEnrollmentSerializer(serializers.ModelSerializer):
    course = EnrollmentCourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "code",
            "status",
            "course",
            "applied_at",
            "approved_at",
            "completed_at",
            "certificate_code",
            "certificate_issued_on",
        ]
        read_only_fields = fields


class ApplySerializer(serializers.Serializer):
    """A signed-in student applying for another course."""

    course = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Course.objects.filter(status=Course.Status.PUBLISHED),
        error_messages={"does_not_exist": "Choose a course from the list."},
    )
    accept_no_refund = serializers.BooleanField()

    def validate_accept_no_refund(self, value):
        if not value:
            raise serializers.ValidationError(
                "Please confirm you understand that no refund is allowed after confirmation."
            )
        return value


class DashboardCountsSerializer(serializers.Serializer):
    pending = serializers.IntegerField()
    active = serializers.IntegerField()
    completed = serializers.IntegerField()
    certificates = serializers.IntegerField()


class DashboardSerializer(serializers.Serializer):
    """Response shape of GET /me/dashboard/ (for the schema)."""

    counts = DashboardCountsSerializer()
    current = MyEnrollmentSerializer(many=True, help_text="Pending and active enrollments.")
    certificates = MyEnrollmentSerializer(many=True, help_text="The three most recent.")
    upcoming = AnnouncementSerializer(many=True, help_text="Holidays and events from today.")


# ---------------------------------------------------------------------------------------------
# Certificates (Phase 7). A certificate is the certificate_* fields of a completed Enrollment.


class CertificateListSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="certificate_code")
    issued_on = serializers.DateField(source="certificate_issued_on")
    course = EnrollmentCourseSerializer()

    class Meta:
        model = Enrollment
        fields = ["code", "issued_on", "course"]
        read_only_fields = fields


class CertificateSerializer(serializers.Serializer):
    """Everything printed on the certificate (from students.services.CertificateData)."""

    code = serializers.CharField()
    student_name = serializers.CharField()
    course_name = serializers.CharField()
    course_kind = serializers.CharField()
    duration = serializers.CharField()
    issued_on = serializers.DateField()
    director_name = serializers.CharField(allow_blank=True)
    verify_url = serializers.URLField()


class VerificationSerializer(serializers.Serializer):
    """What the public verify page may show: no contact or personal details beyond the name."""

    valid = serializers.BooleanField()
    code = serializers.CharField()
    student_name = serializers.CharField()
    course_name = serializers.CharField()
    duration = serializers.CharField()
    issued_on = serializers.DateField()
