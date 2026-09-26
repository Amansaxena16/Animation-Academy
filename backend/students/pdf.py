"""Certificate PDF, rendered with WeasyPrint from students/templates/students/certificate.html.
Fonts (SIL OFL) and the two logo files live in students/certificate/."""

from pathlib import Path

from django.template.loader import render_to_string
from weasyprint import HTML

from .services import CertificateData

ASSETS = Path(__file__).resolve().parent / "certificate"


def long_date(d) -> str:
    return f"{d.day} {d.strftime('%B %Y')}"  # 24 September 2026 (no leading zero)


def name_size_mm(name: str) -> float:
    """The design's 18.4mm, shrunk for long names so they stay inside the border."""
    # Italic capitals are about 0.72em wide; the name line has ~240mm to work with.
    return round(min(18.4, 240 / (max(len(name), 1) * 0.72)), 1)


def certificate_pdf(c: CertificateData) -> bytes:
    html = render_to_string(
        "students/certificate.html",
        {
            "c": c,
            "issued_on_long": long_date(c.issued_on),
            "name_size_mm": name_size_mm(c.student_name),
        },
    )
    return HTML(string=html, base_url=str(ASSETS)).write_pdf()
