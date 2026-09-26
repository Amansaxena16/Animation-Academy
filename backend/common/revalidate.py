"""Tell the Next.js site to drop its cached copy of some API data (tags: "courses", "site",
"announcements"), so an edit shows on the next page load instead of after up to 5 minutes.

Best effort: the site still refreshes on its own within 5 minutes if this call fails."""

import json
import logging
import threading
import urllib.request

from django.conf import settings
from django.db import transaction

log = logging.getLogger(__name__)


def _post(tags: list[str]) -> None:
    request = urllib.request.Request(
        settings.FRONTEND_REVALIDATE_URL,
        data=json.dumps({"tags": tags}).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Revalidate-Secret": settings.REVALIDATE_SECRET,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=3):  # noqa: S310 (URL comes from settings)
            pass
    except Exception as e:  # the site refreshes itself within 5 minutes anyway
        log.warning("Couldn't revalidate %s on the website: %s", tags, e)


def revalidate(*tags: str) -> None:
    """After the current transaction commits, ask the website to refresh these tags."""
    if not settings.FRONTEND_REVALIDATE_URL or not settings.REVALIDATE_SECRET:
        return
    tag_list = sorted(set(tags))
    # In a thread, so a slow or sleeping website never slows down an admin request.
    transaction.on_commit(
        lambda: threading.Thread(target=_post, args=(tag_list,), daemon=True).start()
    )
