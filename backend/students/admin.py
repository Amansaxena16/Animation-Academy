from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html

from .models import Enrollment, Student
from .services import certificate_data, certified, issue_certificate
from .views import pdf_response


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
    list_display = ["code", "student", "course", "status", "applied_at", "certificate_link"]
    list_filter = ["status", "course"]
    search_fields = ["code", "student__name", "student__code", "certificate_code"]
    # Certificates are only issued through the action below, never typed in.
    readonly_fields = [
        "code",
        "applied_at",
        "certificate_code",
        "certificate_issued_on",
        "certificate_issued_by",
    ]
    raw_id_fields = ["student"]
    actions = ["issue_certificates"]

    @admin.display(description="Certificate")
    def certificate_link(self, obj):
        if not obj.certificate_code:
            return "—"
        url = reverse("admin:students_enrollment_certificate_pdf", args=[obj.pk])
        return format_html('<a href="{}">{} (PDF)</a>', url, obj.certificate_code)

    @admin.action(description="Complete and issue certificates (active enrollments only)")
    def issue_certificates(self, request, queryset):
        issued, skipped = 0, []
        for enrollment in queryset.select_related("course", "student"):
            try:
                issue_certificate(enrollment, by=request.user)
                issued += 1
            except ValidationError:
                skipped.append(enrollment.code)
        if issued:
            self.message_user(request, f"Issued {issued} certificate(s).", messages.SUCCESS)
        if skipped:
            self.message_user(
                request,
                f"Skipped {', '.join(skipped)}: only active enrollments can be completed.",
                messages.WARNING,
            )

    def get_urls(self):
        extra = [
            path(
                "<int:pk>/certificate.pdf",
                self.admin_site.admin_view(self.certificate_pdf),
                name="students_enrollment_certificate_pdf",
            )
        ]
        return extra + super().get_urls()

    def certificate_pdf(self, request, pk):
        enrollment = get_object_or_404(certified(), pk=pk)
        return pdf_response(certificate_data(enrollment))
