import pytest

from accounts.models import User

pytestmark = pytest.mark.django_db


def test_create_user_defaults_to_student_and_lowercases_email():
    user = User.objects.create_user(email="Sneha.K@Outlook.com", password="x")
    assert user.email == "sneha.k@outlook.com"
    assert user.role == User.Role.STUDENT
    assert user.is_student and not user.is_admin
    assert not user.is_staff


def test_create_superuser_is_admin_and_staff():
    user = User.objects.create_superuser(email="director@animationacademy.in", password="x")
    assert user.is_admin and user.is_staff and user.is_superuser


def test_superuser_must_be_admin():
    with pytest.raises(ValueError):
        User.objects.create_superuser(email="a@b.in", password="x", role=User.Role.STUDENT)


def test_display_name_falls_back_to_email():
    assert User(email="a@b.in").display_name == "a@b.in"
    assert User(email="a@b.in", full_name="Office").display_name == "Office"
