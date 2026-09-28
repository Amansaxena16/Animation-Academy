import re

MOBILE_RE = re.compile(r"[6-9]\d{9}")


def normalise_mobile(value: str) -> str:
    """Digits only, without the +91 / 0 prefix: "+91 98110 45236", "098110 45236" → "9811045236"."""
    digits = re.sub(r"\D", "", value)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits
