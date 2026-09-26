"""Business actions on enrollments. Certificates are only ever issued by staff (Phase 8 console,
or the Django admin action), never automatically."""

from dataclasses import dataclass
from datetime import date

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from common import ids
from website.models import SiteSettings

from .models import Enrollment


def issue_certificate(enrollment: Enrollment, by=None) -> Enrollment:
    """Mark an Active enrollment Completed and give it a certificate. Idempotent: an enrollment
    that already has a certificate is returned unchanged."""
    with transaction.atomic():
        e = Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        if e.certificate_code:
            return e
        if e.status != Enrollment.Status.ACTIVE:
            raise ValidationError(
                f"Only an active enrollment can be completed (this one is {e.status.lower()})."
            )
        today = timezone.localdate()
        e.status = Enrollment.Status.COMPLETED
        e.completed_at = timezone.now()
        e.certificate_code = ids.certificate_code(e.pk, today.year)
        e.certificate_issued_on = today
        e.certificate_issued_by = by
        e.save()
        return e


@dataclass(frozen=True)
class CertificateData:
    """Everything printed on a certificate (the screen view, the PDF and verification)."""

    code: str
    student_name: str
    course_name: str
    course_kind: str
    duration: str
    issued_on: date
    director_name: str
    verify_url: str


def certificate_data(enrollment: Enrollment) -> CertificateData:
    return CertificateData(
        code=enrollment.certificate_code,
        student_name=enrollment.student.name,
        course_name=enrollment.course.name,
        course_kind=enrollment.course.kind,
        duration=enrollment.course.duration_label,
        issued_on=enrollment.certificate_issued_on,
        director_name=SiteSettings.load().director_name,
        verify_url=f"{settings.PUBLIC_SITE_URL.rstrip('/')}/verify/{enrollment.certificate_code}",
    )


def certified():
    """Enrollments that carry a certificate, with what the certificate needs."""
    return Enrollment.objects.exclude(certificate_code=None).select_related("student", "course")
