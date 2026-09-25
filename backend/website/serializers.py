import re

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Announcement, ContactMessage, Course, SiteSettings


class CourseListSerializer(serializers.ModelSerializer):
    """Card fields for the catalogue. Fees are rupees; `total_fee` excludes registration."""

    total_fee = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(read_only=True, allow_null=True)

    class Meta:
        model = Course
        fields = [
            "slug",
            "name",
            "kind",
            "category",
            "level",
            "duration_label",
            "months",
            "monthly_fee",
            "first_month_fee",
            "total_fee",
            "description",
            "image",
            "featured",
            "tag",
            "schedule",
            "next_batch_start",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.image:
            data["image"] = None  # "" would be a broken <img src>
        return data


class SyllabusGroupSerializer(serializers.Serializer):
    title = serializers.CharField(allow_blank=True)
    duration = serializers.CharField(allow_blank=True)
    tools = serializers.CharField(allow_blank=True)
    items = serializers.ListField(child=serializers.CharField())


class CourseDetailSerializer(CourseListSerializer):
    syllabus = SyllabusGroupSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = [*CourseListSerializer.Meta.fields, "syllabus"]
        read_only_fields = fields


class CategorySerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField(help_text="Published courses in this category.")


class StatSerializer(serializers.Serializer):
    value = serializers.CharField(help_text='As the office typed it: "500+".')
    label = serializers.CharField()


class SiteSerializer(serializers.ModelSerializer):
    """Public institute details and homepage text."""

    stats = serializers.SerializerMethodField()
    phones = serializers.ListField(
        source="phone_list", child=serializers.CharField(), read_only=True
    )

    class Meta:
        model = SiteSettings
        fields = [
            "hero_headline",
            "hero_sub",
            "stats",
            "about",
            "phones",
            "email",
            "address",
            "registration_fee",
            "allow_registration",
            "maintenance_mode",
        ]
        read_only_fields = fields

    @extend_schema_field(StatSerializer(many=True))
    def get_stats(self, obj):
        """Empty when the office has hidden the numbers band."""
        return obj.stats if obj.show_stats else []


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "text", "category", "date"]
        read_only_fields = fields


class ContactSerializer(serializers.ModelSerializer):
    # Hidden form field that people never see; bots fill it in.
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = ContactMessage
        fields = ["name", "email", "phone", "message", "website"]
        extra_kwargs = {"phone": {"required": False}}

    def validate_name(self, value):
        value = " ".join(value.split())
        if len(value) < 2:
            raise serializers.ValidationError("Tell us your name so we know who to call.")
        return value

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if value and len(digits) != 10:
            raise serializers.ValidationError("Enter a 10-digit mobile number, e.g. 98110 45236.")
        return digits

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Write a little more so we can help, at least 10 characters."
            )
        return value
