import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command

from website.models import Course, validate_syllabus

pytestmark = pytest.mark.django_db

LIST = "/api/v1/courses/"
CATEGORIES = "/api/v1/courses/categories/"


def detail(slug):
    return f"/api/v1/courses/{slug}/"


@pytest.fixture
def seeded():
    call_command("seed_courses", verbosity=0)


def slugs(res):
    return [c["slug"] for c in res.data]


class TestModel:
    def test_total_fee(self):
        assert Course(monthly_fee=800, months=6).total_fee == 4800

    def test_total_fee_with_first_month_fee(self):
        pdm = Course(monthly_fee=3000, first_month_fee=4000, months=18)
        assert pdm.total_fee == 55000  # ₹4,000 + ₹3,000 × 17

    def test_first_month_fee_needs_two_months(self):
        with pytest.raises(ValidationError):
            Course(monthly_fee=500, first_month_fee=900, months=1).clean()

    @pytest.mark.parametrize(
        "bad",
        [
            [],
            "HTML",
            [{"items": []}],
            [{"items": ["HTML", ""]}],
            [{"title": 5, "items": ["HTML"]}],
            [{"items": ["HTML"], "extra": True}],
        ],
    )
    def test_syllabus_validator_rejects(self, bad):
        with pytest.raises(ValidationError):
            validate_syllabus(bad)

    def test_syllabus_validator_accepts_groups(self):
        validate_syllabus([{"title": "", "duration": "", "tools": "", "items": ["HTML"]}])


class TestSeed:
    def test_seeds_the_nine_prospectus_courses_idempotently(self, seeded):
        call_command("seed_courses", verbosity=0)
        assert Course.objects.count() == 9
        totals = dict(Course.objects.values_list("slug", "monthly_fee"))
        assert totals["dca-prog"] == 850 and totals["dwd"] == 1000 and totals["ccc"] == 1200
        pdm = Course.objects.get(slug="pdm")
        assert pdm.total_fee == 55000
        assert [g["title"][:6] for g in pdm.syllabus] == [
            "Sem-I ",
            "Sem-II",
            "Sem-II",
            "Sem-IV",
            "Sem-V ",
        ]


class TestList:
    def test_returns_published_courses_in_order_unpaginated(self, api, seeded):
        Course.objects.filter(slug="pgctt").update(status=Course.Status.DRAFT)
        res = api.get(LIST)
        assert res.status_code == 200
        assert isinstance(res.data, list)
        assert slugs(res) == ["dca-prog", "dca-acc", "dtp", "dwd", "ccc", "pgdca", "pgdwd", "pdm"]

    def test_card_fields_without_syllabus(self, api, seeded):
        card = api.get(LIST).data[0]
        assert card["total_fee"] == 5100
        assert card["image"] is None
        assert "syllabus" not in card and "status" not in card

    def test_search_covers_the_syllabus(self, api, seeded):
        assert slugs(api.get(LIST, {"q": "tally"})) == ["dca-acc", "pgdca"]
        assert slugs(api.get(LIST, {"q": "zbrush"})) == ["pdm"]
        assert slugs(api.get(LIST, {"q": "nothing-like-this"})) == []

    def test_filters(self, api, seeded):
        assert slugs(api.get(LIST, {"category": "Web Designing"})) == ["dwd", "pgdwd"]
        assert slugs(api.get(LIST, {"level": "Advanced"})) == ["dwd", "pdm"]
        assert slugs(api.get(LIST, {"max_fee": 750})) == ["pgdca"]
        assert slugs(api.get(LIST, {"min_fee": 1100})) == ["ccc", "pdm"]
        assert len(api.get(LIST, {"featured": "true"}).data) == 6

    def test_bad_filter_value_is_a_400_in_the_error_shape(self, api, seeded):
        res = api.get(LIST, {"category": "Cooking"})
        assert res.status_code == 400
        assert "category" in res.data["errors"]

    def test_ordering(self, api, seeded):
        fees = [c["monthly_fee"] for c in api.get(LIST, {"ordering": "monthly_fee"}).data]
        assert fees == sorted(fees)

    def test_a_stale_token_does_not_block_public_data(self, api, seeded):
        api.credentials(HTTP_AUTHORIZATION="Bearer expired.or.garbage")
        assert api.get(LIST).status_code == 200


class TestDetail:
    def test_includes_syllabus(self, api, seeded):
        res = api.get(detail("dca-acc"))
        assert res.status_code == 200
        assert res.data["name"] == "DCA — Accounting"
        assert res.data["syllabus"][0]["items"][-1] == "Return File GSTR1 & GSTR 3B"

    def test_draft_and_unknown_courses_are_404(self, api, seeded):
        Course.objects.filter(slug="dtp").update(status=Course.Status.DRAFT)
        assert api.get(detail("dtp")).status_code == 404
        assert api.get(detail("no-such-course")).status_code == 404


class TestCategories:
    def test_every_category_with_published_counts(self, api, seeded):
        Course.objects.filter(slug="ccc").update(status=Course.Status.DRAFT)
        data = {c["value"]: c["count"] for c in api.get(CATEGORIES).data}
        assert data == {
            "Programming": 2,
            "Accounting": 2,
            "Design": 1,
            "Web Designing": 2,
            "Computer Basics": 0,
            "Multimedia": 1,
        }
