import django_filters
from django.db.models import Q, TextField
from django.db.models.functions import Cast

from .models import Course


class CourseFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method="search", label="Search name, description and syllabus")
    category = django_filters.ChoiceFilter(choices=Course.Category.choices)
    level = django_filters.ChoiceFilter(choices=Course.Level.choices)
    min_fee = django_filters.NumberFilter(field_name="monthly_fee", lookup_expr="gte")
    max_fee = django_filters.NumberFilter(field_name="monthly_fee", lookup_expr="lte")
    featured = django_filters.BooleanFilter()

    class Meta:
        model = Course
        fields = ["q", "category", "level", "min_fee", "max_fee", "featured"]

    def search(self, queryset, name, value):
        value = value.strip()
        if not value:
            return queryset
        # The syllabus is JSON; searching its text form finds "Tally" in DCA — Accounting.
        return queryset.annotate(syllabus_text=Cast("syllabus", TextField())).filter(
            Q(name__icontains=value)
            | Q(description__icontains=value)
            | Q(syllabus_text__icontains=value)
        )
