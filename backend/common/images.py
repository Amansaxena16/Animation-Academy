"""Uploaded images are re-encoded: that checks they really are images, drops EXIF (camera,
GPS location) and anything hidden in the file, and caps the size."""

import io
import uuid

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers


def reencode_image(upload, *, max_bytes: int, max_size: tuple[int, int]) -> ContentFile:
    if upload.size > max_bytes:
        raise serializers.ValidationError(
            f"The image must be {max_bytes // (1024 * 1024)} MB or smaller."
        )
    try:
        image = Image.open(upload)
        if image.format not in {"JPEG", "PNG", "WEBP"}:
            raise serializers.ValidationError("Choose a JPEG or PNG image.")
        image = image.convert("RGB")
    except (UnidentifiedImageError, OSError) as e:
        raise serializers.ValidationError("That file isn't a readable image.") from e
    image.thumbnail(max_size)
    out = io.BytesIO()
    image.save(out, format="JPEG", quality=85)
    return ContentFile(out.getvalue(), name=f"{uuid.uuid4().hex}.jpg")
