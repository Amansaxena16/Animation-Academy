from django.contrib.auth import password_validation
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="display_name", read_only=True)
    student_code = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ["email", "name", "role", "student_code"]
        read_only_fields = fields


class LoginSerializer(TokenObtainPairSerializer):
    """Email + password → access and refresh tokens carrying the user's role and name."""

    default_error_messages = {
        "no_active_account": "Email or password is incorrect.",
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.display_name
        return token

    def validate(self, attrs):
        attrs[self.username_field] = attrs[self.username_field].strip().lower()
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value

    def validate_new_password(self, value):
        password_validation.validate_password(value, self.context["request"].user)
        return value

    def validate(self, attrs):
        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": ["Choose a password different from your current one."]}
            )
        return attrs


class AccessTokenSerializer(serializers.Serializer):
    """Response of login and refresh. The refresh token travels only in the httpOnly cookie."""

    access = serializers.CharField()
    user = UserSerializer()
