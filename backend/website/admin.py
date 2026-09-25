from django.contrib import admin

from .models import Announcement, ContactMessage, Course, SiteSettings


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


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = [
        ("Home page", {"fields": ["hero_headline", "hero_sub", "about"]}),
        (
            "Numbers band",
            {
                "fields": [
                    "show_stats",
                    "stat_students",
                    "stat_courses",
                    "stat_years",
                    "stat_certificates",
                ]
            },
        ),
        ("Contact", {"fields": ["phones", "email", "address"]}),
        ("Admissions and certificates", {"fields": ["registration_fee", "director_name"]}),
        ("Switches", {"fields": ["allow_registration", "maintenance_mode"]}),
    ]

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "date", "published"]
    list_editable = ["published"]
    list_filter = ["published", "category"]
    search_fields = ["title", "text"]
    date_hierarchy = "date"


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone", "created_at", "handled"]
    list_editable = ["handled"]
    list_filter = ["handled"]
    search_fields = ["name", "email", "message"]
    readonly_fields = ["name", "email", "phone", "message", "created_at"]
