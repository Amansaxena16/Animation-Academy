"""Human-readable IDs, allocated from a locked counter so concurrent requests never collide."""

from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Sequence

# Where the counters start. If the institute's paper registers already go higher,
# raise last_value in the Sequence admin before going live.
STUDENT_START = 1000
ENROLLMENT_START = 2000


def next_value(name: str, start: int = 0) -> int:
    """Increment and return the counter `name`. The first value handed out is start + 1."""
    try:
        # Savepoint, so a lost creation race doesn't break the caller's transaction.
        with transaction.atomic():
            Sequence.objects.get_or_create(name=name, defaults={"last_value": start})
    except IntegrityError:
        pass  # Another request created the row first; it exists now.
    with transaction.atomic():
        seq = Sequence.objects.select_for_update().get(name=name)
        seq.last_value += 1
        seq.save(update_fields=["last_value"])
        return seq.last_value


def student_code() -> str:
    return f"AA-STU-{next_value('student', STUDENT_START):04d}"


def enrollment_code() -> str:
    return f"EN-{next_value('enrollment', ENROLLMENT_START):04d}"


def certificate_code(year: int | None = None) -> str:
    year = year or timezone.localdate().year
    return f"AA-{year}-{next_value(f'certificate-{year}'):06d}"
