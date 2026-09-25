from django.contrib import admin

from .models import Enrollment, Student


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    fields = ["code", "course", "status", "applied_at", "certificate_code"]
    readonly_fields = ["code", "applied_at", "certificate_code"]


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "mobile", "city", "status", "joined_at"]
    list_filter = ["status", "employment", "city"]
    search_fields = ["code", "name", "father_name", "mobile", "user__email"]
    readonly_fields = ["code", "joined_at", "updated_at"]
    raw_id_fields = ["user"]
    inlines = [EnrollmentInline]
    fieldsets = [
        (None, {"fields": ["code", "user", "status"]}),
        ("Personal", {"fields": ["name", "father_name", "dob", "gender", "photo"]}),
        (
            "Contact",
            {"fields": ["mobile", "phone", "address", "pincode", "city", "state", "country"]},
        ),
        ("Education and work", {"fields": ["qualifications", "employment"]}),
        ("Dates", {"fields": ["joined_at", "updated_at"]}),
    ]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["code", "student", "course", "status", "applied_at", "certificate_code"]
    list_filter = ["status", "course"]
    search_fields = ["code", "student__name", "student__code", "certificate_code"]
    readonly_fields = ["code", "applied_at"]
    raw_id_fields = ["student", "certificate_issued_by"]
