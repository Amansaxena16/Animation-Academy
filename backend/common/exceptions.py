"""One error shape for the whole API: {"detail": "...", "errors": {"field": ["message"]}}."""

from rest_framework import exceptions
from rest_framework.views import exception_handler

VALIDATION_DETAIL = "Check the highlighted fields."


def _flatten(errors):
    """Turn DRF's nested error lists into {"field": ["message", ...]}."""
    if isinstance(errors, dict):
        return {key: _messages(value) for key, value in errors.items()}
    return {"non_field_errors": _messages(errors)}


def _messages(value):
    if isinstance(value, list):
        out = []
        for item in value:
            out.extend(_messages(item) if isinstance(item, (list, dict)) else [str(item)])
        return out
    if isinstance(value, dict):
        return [f"{k}: {m}" for k, v in value.items() for m in _messages(v)]
    return [str(value)]


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.ValidationError):
        errors = _flatten(response.data)
        non_field = errors.get("non_field_errors")
        detail = non_field[0] if non_field and len(errors) == 1 else VALIDATION_DETAIL
        response.data = {"detail": detail, "errors": errors}
    else:
        data = response.data
        detail = data.get("detail", "") if isinstance(data, dict) else str(data)
        response.data = {"detail": str(detail), "errors": {}}
        if isinstance(data, dict) and "code" in data:
            response.data["code"] = data["code"]
    return response
