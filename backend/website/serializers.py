from rest_framework import serializers

from .models import Course


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
