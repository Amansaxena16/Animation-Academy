"""Human-readable IDs built from the database's own auto-increment primary key.

The pk is unique and assigned by Postgres, so two requests can never get the same code.
Numbers can skip (a rolled-back insert still uses up its pk), which is harmless for IDs.

A model sets its code right after the first save, once the pk exists:

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = student_code(self.pk)
            super().save(update_fields=["code"])
"""

# Where the numbering starts. If the institute's paper registers already go higher,
# raise these before going live (they only change how new codes are printed).
STUDENT_OFFSET = 1000
ENROLLMENT_OFFSET = 2000


def student_code(pk: int) -> str:
    """AA-STU-1001 for the first student."""
    return f"AA-STU-{STUDENT_OFFSET + pk:04d}"


def enrollment_code(pk: int) -> str:
    """EN-2001 for the first enrollment."""
    return f"EN-{ENROLLMENT_OFFSET + pk:04d}"


def certificate_code(enrollment_pk: int, year: int) -> str:
    """AA-2026-000057: the issue year plus the enrollment's pk.

    Each enrollment gets at most one certificate, so the code is unique. The number doesn't
    restart each year and has gaps (not every enrollment is completed).
    """
    return f"AA-{year}-{enrollment_pk:06d}"
