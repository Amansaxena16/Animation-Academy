from django.contrib import admin

from .models import Sequence


@admin.register(Sequence)
class SequenceAdmin(admin.ModelAdmin):
    list_display = ["name", "last_value"]
