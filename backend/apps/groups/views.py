from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Group, GroupMembership, _generate_invite_code
from .serializers import GroupSerializer, GroupCreateSerializer, GroupMembershipSerializer
from .permissions import IsGroupAdmin, IsGroupMember


class GroupListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/groups/  — list groups the current user belongs to
    POST /api/groups/  — create a new group (current user becomes group_admin)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return GroupCreateSerializer
        return GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(memberships__user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        # Creator automatically becomes group_admin
        GroupMembership.objects.create(
            user=self.request.user,
            group=group,
            role=GroupMembership.Role.GROUP_ADMIN,
        )


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/groups/{id}/  — group detail (members only)
    PATCH  /api/groups/{id}/  — update group (admin only)
    DELETE /api/groups/{id}/  — delete group (admin only)
    """

    queryset = Group.objects.all()
    lookup_url_kwarg = "pk"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return GroupCreateSerializer
        return GroupSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [permissions.IsAuthenticated(), IsGroupAdmin()]
        return [permissions.IsAuthenticated(), IsGroupMember()]


class GroupMembersView(generics.ListAPIView):
    """GET /api/groups/{group_id}/members/ — list all members of a group."""

    serializer_class = GroupMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        return GroupMembership.objects.filter(
            group_id=self.kwargs["group_id"]
        ).select_related("user")


class JoinByCodeView(APIView):
    """
    POST /api/groups/join/  — join a group using its invite code.
    Body: { "code": "XXXXXXXX" }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = (request.data.get("code") or "").strip().upper()
        if not code:
            return Response({"detail": "Invite code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            group = Group.objects.get(invite_code=code)
        except Group.DoesNotExist:
            return Response({"detail": "Invalid invite code."}, status=status.HTTP_404_NOT_FOUND)
        membership, created = GroupMembership.objects.get_or_create(
            user=request.user,
            group=group,
            defaults={"role": GroupMembership.Role.MEMBER},
        )
        if not created:
            return Response({"detail": "You are already a member of this group."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GroupSerializer(group, context={"request": request}).data, status=status.HTTP_201_CREATED)


class RegenerateInviteCodeView(APIView):
    """
    POST /api/groups/{group_id}/regenerate-code/
    Generates a new invite code for the group. Admin only.
    """

    permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        code = _generate_invite_code()
        while Group.objects.filter(invite_code=code).exclude(pk=group.pk).exists():
            code = _generate_invite_code()
        group.invite_code = code
        group.save(update_fields=["invite_code"])
        return Response({"invite_code": group.invite_code})


class RemoveMemberView(APIView):
    """DELETE /api/groups/{group_id}/members/{user_id}/ — remove a member (admin only)."""

    permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

    def delete(self, request, group_id, user_id):
        # Prevent admin from removing themselves via this endpoint
        if request.user.pk == int(user_id):
            return Response(
                {"detail": "You cannot remove yourself. Transfer admin role first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership = get_object_or_404(GroupMembership, group_id=group_id, user_id=user_id)
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateMemberRoleView(APIView):
    """PATCH /api/groups/{group_id}/members/{user_id}/ — change a member's role (admin only)."""

    permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

    def patch(self, request, group_id, user_id):
        membership = get_object_or_404(GroupMembership, group_id=group_id, user_id=user_id)
        new_role = request.data.get("role")
        if new_role not in GroupMembership.Role.values:
            return Response(
                {"detail": f"Invalid role. Choose from: {GroupMembership.Role.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership.role = new_role
        membership.save(update_fields=["role"])
        return Response(GroupMembershipSerializer(membership).data)
