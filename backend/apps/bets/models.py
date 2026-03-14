from django.conf import settings
from django.db import models


class Currency(models.Model):
    code = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=5, blank=True, default="")

    class Meta:
        ordering = ["code"]
        verbose_name_plural = "currencies"

    def __str__(self):
        return f"{self.code} – {self.name}"



class BetStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    OPEN = "open", "Open"
    REJECTED = "rejected", "Rejected"
    RESOLVED = "resolved", "Resolved"
    CANCELLED = "cancelled", "Cancelled"


class Bet(models.Model):
    """
    A 1-v-1 challenge/bet between two members of the same group.

    Design notes:
    - challenger: the user who proposes/creates the bet (participant A)
    - opponent: the user being challenged (participant B)
    - winner: nullable FK populated when the bet is resolved
    - Both challenger and opponent must be members of the group at creation time.
    """

    group = models.ForeignKey(
        "groups.Group",
        on_delete=models.CASCADE,
        related_name="bets",
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_bets",
        help_text="The user who created this bet record (may be an admin acting on behalf).",
    )
    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="challenged_bets",
        help_text="Participant A — the one issuing the challenge.",
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="opponent_bets",
        help_text="Participant B — the one being challenged.",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    challenger_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="What the challenger stands to win (paid by opponent if challenger wins)."
    )
    opponent_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="What the opponent stands to win (paid by challenger if opponent wins)."
    )
    currency = models.CharField(max_length=10, default="ILS")
    # Dates
    due_date = models.DateField(
        null=True, blank=True, help_text="Deadline to resolve the bet."
    )
    # Status & resolution
    status = models.CharField(
        max_length=20, choices=BetStatus.choices, default=BetStatus.OPEN
    )
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_bets",
    )
    outcome_notes = models.TextField(blank=True, default="")
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_bets",
    )
    awaiting_response_from = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pending_bets",
        help_text="User whose turn it is to accept/reject/counter this proposal.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.group.name})"
