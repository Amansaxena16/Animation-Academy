from django.contrib import admin

from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["name", "kind", "category", "duration_label", "monthly_fee", "status", "order"]
    list_editable = ["status", "order"]
    list_filter = ["status", "category", "kind", "level", "featured"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ["name"]}
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        (None, {"fields": ["name", "slug", "kind", "category", "level", "status"]}),
        ("Fees", {"fields": ["duration_label", "months", "monthly_fee", "first_month_fee"]}),
        ("Content", {"fields": ["description", "syllabus", "image", "tag", "featured"]}),
        ("Batch", {"fields": ["schedule", "next_batch_start", "order"]}),
        ("Dates", {"fields": ["created_at", "updated_at"]}),
    ]
