import pytest
from django.urls import path
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from common import ids
from common.exceptions import api_exception_handler
from common.permissions import IsAdmin, IsStudent
from conftest import auth_client

pytestmark = pytest.mark.django_db


class StudentOnly(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        return Response({"ok": True})


class AdminOnly(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({"ok": True})


urlpatterns = [path("student/", StudentOnly.as_view()), path("admin/", AdminOnly.as_view())]


@pytest.mark.urls("common.tests.test_common")
class TestRolePermissions:
    def test_student_area(self, api, student_user, admin_user):
        assert auth_client(student_user).get("/student/").status_code == 200
        res = auth_client(admin_user).get("/student/")
        assert res.status_code == 403
        assert res.data == {"detail": "This area is for students.", "errors": {}}
        assert api.get("/student/").status_code == 401

    def test_admin_area(self, api, student_user, admin_user):
        assert auth_client(admin_user).get("/admin/").status_code == 200
        res = auth_client(student_user).get("/admin/")
        assert res.status_code == 403
        assert res.data["detail"] == "This area is for institute staff."
        assert api.get("/admin/").status_code == 401


class TestErrorShape:
    def test_nested_validation_errors_are_flattened(self):
        exc = serializers.ValidationError(
            {
                "pincode": ["Enter a 6-digit pincode, e.g. 208012."],
                "quals": [{"year": ["Required."]}],
            }
        )
        res = api_exception_handler(exc, {})
        assert res.data == {
            "detail": "Check the highlighted fields.",
            "errors": {
                "pincode": ["Enter a 6-digit pincode, e.g. 208012."],
                "quals": ["year: Required."],
            },
        }

    def test_single_non_field_error_becomes_the_detail(self):
        exc = serializers.ValidationError("Registration is closed.")
        res = api_exception_handler(exc, {})
        assert res.data["detail"] == "Registration is closed."
        assert res.data["errors"] == {"non_field_errors": ["Registration is closed."]}


class TestIds:
    def test_student_code(self):
        assert ids.student_code(1) == "AA-STU-1001"
        assert ids.student_code(42) == "AA-STU-1042"

    def test_enrollment_code(self):
        assert ids.enrollment_code(1) == "EN-2001"
        assert ids.enrollment_code(107) == "EN-2107"

    def test_certificate_code(self):
        assert ids.certificate_code(123, 2026) == "AA-2026-000123"
        assert ids.certificate_code(7, 2027) == "AA-2027-000007"
