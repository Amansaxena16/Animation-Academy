from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import User


class UserCreateForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ["email", "full_name", "role"]


class UserEditForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"
