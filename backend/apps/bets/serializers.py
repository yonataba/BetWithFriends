from rest_framework import serializers
from apps.users.serializers import UserSerializer
from apps.groups.models import GroupMembership
from .models import Bet, Currency, BetStatus


class BetSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    challenger = UserSerializer(read_only=True)
    opponent = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    awaiting_response_from = UserSerializer(read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = Bet
        fields = [
            "id",
            "group",
            "group_name",
            "creator",
            "challenger",
            "opponent",
            "title",
            "description",
            "challenger_amount",
            "opponent_amount",
            "currency",
            "due_date",
            "status",
            "winner",
            "awaiting_response_from",
            "outcome_notes",
            "resolved_at",
            "resolved_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "group",
            "creator",
            "status",
            "winner",
            "awaiting_response_from",
            "outcome_notes",
            "resolved_at",
            "resolved_by",
            "created_at",
            "updated_at",
        ]


class BetCreateSerializer(serializers.ModelSerializer):
    """Used for creating a new bet. Accepts challenger/opponent as PKs."""

    challenger_id = serializers.IntegerField()
    opponent_id = serializers.IntegerField()

    class Meta:
        model = Bet
        fields = [
            "challenger_id",
            "opponent_id",
            "title",
            "description",
            "challenger_amount",
            "opponent_amount",
            "currency",
            "due_date",
        ]

    def validate(self, data):
        group = self.context["group"]
        request_user = self.context["request"].user

        challenger_id = data["challenger_id"]
        opponent_id = data["opponent_id"]

        if challenger_id == opponent_id:
            raise serializers.ValidationError("Challenger and opponent must be different users.")

        # Verify both participants are group members
        member_ids = set(
            GroupMembership.objects.filter(group=group).values_list("user_id", flat=True)
        )
        for uid, label in [(challenger_id, "Challenger"), (opponent_id, "Opponent")]:
            if uid not in member_ids:
                raise serializers.ValidationError(f"{label} is not a member of this group.")

        # A regular member can only create a bet involving themselves
        is_admin = GroupMembership.objects.filter(
            user=request_user,
            group=group,
            role=GroupMembership.Role.GROUP_ADMIN,
        ).exists()

        if not is_admin:
            if request_user.pk not in (challenger_id, opponent_id):
                raise serializers.ValidationError(
                    "Regular members can only create bets involving themselves."
                )

        return data

    def create(self, validated_data):
        from apps.users.models import User

        challenger = User.objects.get(pk=validated_data.pop("challenger_id"))
        opponent = User.objects.get(pk=validated_data.pop("opponent_id"))
        return Bet.objects.create(
            challenger=challenger,
            opponent=opponent,
            **validated_data,
        )


class ResolveBetSerializer(serializers.Serializer):
    """Payload for resolving a bet."""

    winner_id = serializers.IntegerField()
    outcome_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_winner_id(self, value):
        bet = self.context["bet"]
        valid_ids = {bet.challenger_id, bet.opponent_id}
        if value not in valid_ids:
            raise serializers.ValidationError("Winner must be one of the bet participants.")
        return value
