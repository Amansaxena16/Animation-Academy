import datetime

import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.utils import timezone

from website.models import Announcement, ContactMessage, SiteSettings

pytestmark = pytest.mark.django_db

SITE = "/api/v1/site/"
ANNOUNCEMENTS = "/api/v1/announcements/"
CONTACT = "/api/v1/contact/"


def days(n):
    return timezone.localdate() + datetime.timedelta(days=n)


class TestSiteSettings:
    def test_load_creates_one_row_with_defaults(self):
        s = SiteSettings.load()
        assert s.pk == 1 and s.registration_fee == 250
        assert SiteSettings.load().pk == 1
        assert SiteSettings.objects.count() == 1

    def test_saving_another_instance_still_writes_row_one(self):
        SiteSettings(email="office@example.in").save()
        assert SiteSettings.objects.count() == 1
        assert SiteSettings.load().email == "office@example.in"

    def test_cannot_be_deleted(self):
        with pytest.raises(ValidationError):
            SiteSettings.load().delete()

    def test_public_endpoint(self, api):
        s = SiteSettings.load()
        s.phones = "8707447880,  9336202125 ,"
        s.save()
        data = api.get(SITE).data
        assert data["phones"] == ["8707447880", "9336202125"]
        assert data["stats"][0] == {"value": "500+", "label": "Students trained"}
        assert data["registration_fee"] == 250
        assert "director_name" not in data

    def test_hidden_stats_come_back_empty(self, api):
        s = SiteSettings.load()
        s.show_stats = False
        s.save()
        assert api.get(SITE).data["stats"] == []


class TestSeedContent:
    def test_is_idempotent_and_never_overwrites_settings(self):
        call_command("seed_content", verbosity=0)
        s = SiteSettings.load()
        s.hero_headline = "Edited by the office"
        s.save()
        call_command("seed_content", verbosity=0)
        assert SiteSettings.load().hero_headline == "Edited by the office"
        assert Announcement.objects.count() == 7


class TestAnnouncements:
    @pytest.fixture
    def items(self):
        make = Announcement.objects.create
        return {
            "old": make(title="Old notice", text="t", category="General", date=days(-10)),
            "holiday": make(title="Holiday soon", text="t", category="Holiday", date=days(5)),
            "event": make(title="Event today", text="t", category="Event", date=days(0)),
            "exam": make(title="Exam later", text="t", category="Exam", date=days(20)),
            "draft": make(
                title="Draft", text="t", category="Holiday", date=days(3), published=False
            ),
        }

    def titles(self, res):
        return [a["title"] for a in res.data]

    def test_upcoming_soonest_first_then_past_newest_first(self, api, items):
        Announcement.objects.create(title="Older notice", text="t", date=days(-30))
        res = api.get(ANNOUNCEMENTS)
        assert self.titles(res) == [
            "Event today",
            "Holiday soon",
            "Exam later",
            "Old notice",
            "Older notice",
        ]
        assert set(res.data[0]) == {"id", "title", "text", "category", "date"}

    def test_upcoming_is_holidays_and_events_soonest_first(self, api, items):
        assert self.titles(api.get(ANNOUNCEMENTS, {"upcoming": "true"})) == [
            "Event today",
            "Holiday soon",
        ]

    def test_category_and_limit(self, api, items):
        assert self.titles(api.get(ANNOUNCEMENTS, {"category": "Exam"})) == ["Exam later"]
        assert len(api.get(ANNOUNCEMENTS, {"limit": 2}).data) == 2

    @pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 99}, {"category": "Party"}])
    def test_bad_params_are_400(self, api, params):
        res = api.get(ANNOUNCEMENTS, params)
        assert res.status_code == 400
        assert set(res.data["errors"]) <= {"limit", "category"}


class TestContact:
    VALID = {
        "name": "  Meera   Nair ",
        "email": "meera.nair@gmail.com",
        "phone": "+91 90151 77420",
        "message": "Which batch of DTP starts next month?",
    }

    def test_saves_and_normalises(self, api):
        res = api.post(CONTACT, self.VALID, format="json")
        assert res.status_code == 201
        assert res.data["detail"].startswith("Message sent.")
        msg = ContactMessage.objects.get()
        assert (msg.name, msg.phone, msg.handled) == ("Meera Nair", "9015177420", False)

    def test_phone_is_optional(self, api):
        data = {**self.VALID, "phone": ""}
        assert api.post(CONTACT, data, format="json").status_code == 201

    def test_validation_messages(self, api):
        bad = {"name": "A", "email": "nope", "phone": "12345", "message": "Hi"}
        res = api.post(CONTACT, bad, format="json")
        assert res.status_code == 400
        assert set(res.data["errors"]) == {"name", "email", "phone", "message"}
        assert res.data["errors"]["phone"] == ["Enter a 10-digit mobile number, e.g. 98110 45236."]

    def test_honeypot_pretends_success_but_saves_nothing(self, api):
        res = api.post(CONTACT, {**self.VALID, "website": "http://spam.example"}, format="json")
        assert res.status_code == 201
        assert ContactMessage.objects.count() == 0

    def test_is_throttled(self, api):
        codes = [api.post(CONTACT, self.VALID, format="json").status_code for _ in range(6)]
        assert codes == [201] * 5 + [429]
