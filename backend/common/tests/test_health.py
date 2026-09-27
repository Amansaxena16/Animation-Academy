from unittest import mock

import pytest

pytestmark = pytest.mark.django_db


def test_healthz_ok(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.content == b"ok"


def test_healthz_reports_a_database_outage(client):
    with mock.patch("common.health.connection.ensure_connection", side_effect=Exception):
        assert client.get("/healthz").status_code == 503
