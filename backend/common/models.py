from django.db import models


class Sequence(models.Model):
    """A named counter behind the human-readable IDs (AA-STU-1042, EN-2107, AA-2026-000123)."""

    name = models.CharField(max_length=50, primary_key=True)
    last_value = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.name} = {self.last_value}"
