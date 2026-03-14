from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "nickname", "avatar_url", "is_staff"]
        read_only_fields = ["id", "email", "is_staff"]


class RegisterSerializer(BaseRegisterSerializer):
    """Extends dj-rest-auth registration with optional first/last name and nickname."""

    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    nickname = serializers.CharField(required=False, allow_blank=True)

    def save(self, request):
        user = super().save(request)
        user.first_name = self.validated_data.get("first_name", "")
        user.last_name = self.validated_data.get("last_name", "")
        user.nickname = self.validated_data.get("nickname", "")
        user.save()
        return user
