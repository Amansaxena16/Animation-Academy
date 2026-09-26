from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from common.revalidate import revalidate

from .models import Announcement, Course, SiteSettings

TAGS = {Course: "courses", SiteSettings: "site", Announcement: "announcements"}


@receiver([post_save, post_delete])
def refresh_website(sender, **kwargs):
    """Any change to public content (console, Django admin or shell) refreshes the website."""
    tag = TAGS.get(sender)
    if tag:
        revalidate(tag)
