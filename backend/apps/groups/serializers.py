from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Group, GroupMembership


class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    # Current user's role in this group (populated by view context)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "invite_code",
            "created_by",
            "member_count",
            "my_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "invite_code", "created_by", "created_at", "updated_at"]

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_my_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "description"]
        read_only_fields = ["id"]
