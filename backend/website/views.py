from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import CourseFilter
from .models import Course
from .serializers import CategorySerializer, CourseDetailSerializer, CourseListSerializer


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
