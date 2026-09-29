import logging

log = logging.getLogger("aa.diagnostics")


class LogLoginClientAddress:
    """TEMPORARY: logs the address headers of login requests, to set the rate limiter's proxy
    count correctly on Render. Remove once TRUSTED_PROXY_COUNT is set."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == "/api/v1/auth/login/" and request.method == "POST":
            log.warning(
                "login from REMOTE_ADDR=%s XFF=%s",
                request.META.get("REMOTE_ADDR"),
                request.META.get("HTTP_X_FORWARDED_FOR"),
            )
        return self.get_response(request)
