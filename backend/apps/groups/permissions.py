from rest_framework import permissions
from .models import GroupMembership


class IsGroupMember(permissions.BasePermission):
    """Allow access only to members of the group (any role)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        group_id = view.kwargs.get("group_id") or view.kwargs.get("pk")
        return GroupMembership.objects.filter(
            user=request.user, group_id=group_id
        ).exists()


class IsGroupAdmin(permissions.BasePermission):
    """Allow access only to group_admin members of the group."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        group_id = view.kwargs.get("group_id") or view.kwargs.get("pk")
        return GroupMembership.objects.filter(
            user=request.user,
            group_id=group_id,
            role=GroupMembership.Role.GROUP_ADMIN,
        ).exists()
