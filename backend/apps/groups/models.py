from django.conf import settings
from django.db import models
import secrets
import string


def _generate_invite_code():
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


class Group(models.Model):
    """A group of friends that share bets/challenges."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    invite_code = models.CharField(
        max_length=8,
        unique=True,
        blank=True,
        help_text="8-character code used to join this group.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_groups",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            # Keep generating until we get a unique one
            code = _generate_invite_code()
            while Group.objects.filter(invite_code=code).exists():
                code = _generate_invite_code()
            self.invite_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    """
    Explicit many-to-many between User and Group.
    Role is per-group — a user can be admin in one group and member in another.
    """

    class Role(models.TextChoices):
        GROUP_ADMIN = "group_admin", "Group Admin"
        MEMBER = "member", "Member"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")

    def __str__(self):
        return f"{self.user.email} — {self.group.name} ({self.role})"
