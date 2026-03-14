from django.utils import timezone
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.groups.models import Group, GroupMembership
from apps.groups.permissions import IsGroupMember, IsGroupAdmin
from .models import Bet, BetStatus, Currency
from .serializers import BetSerializer, BetCreateSerializer, ResolveBetSerializer


class CurrencyListView(APIView):
    """GET /api/currencies/ — any authenticated user.
    POST /api/currencies/ — staff only, body: {code, name, symbol}.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        currencies = Currency.objects.values("code", "name", "symbol")
        return Response(list(currencies))

    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        name = request.data.get("name", "").strip()
        symbol = request.data.get("symbol", "").strip()
        if not code or not name:
            return Response({"detail": "code and name are required."}, status=status.HTTP_400_BAD_REQUEST)
        if Currency.objects.filter(code=code).exists():
            return Response({"detail": "Currency with this code already exists."}, status=status.HTTP_400_BAD_REQUEST)
        currency = Currency.objects.create(code=code, name=name, symbol=symbol)
        return Response({"code": currency.code, "name": currency.name, "symbol": currency.symbol}, status=status.HTTP_201_CREATED)


class CurrencyDetailView(APIView):
    """DELETE /api/currencies/{code}/ — staff only."""
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, code):
        currency = get_object_or_404(Currency, code=code.upper())
        currency.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyBetsView(APIView):
    """
    GET /api/bets/my/?status=open|resolved|cancelled
    Returns all bets where the current user is challenger or opponent.
    Optional ?status= filter. Ordered by due_date / created_at.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Bet.objects.filter(
            Q(challenger=request.user) | Q(opponent=request.user)
        ).select_related("creator", "challenger", "opponent", "winner", "group", "awaiting_response_from")

        awaiting_me = request.query_params.get("awaiting_me")
        if awaiting_me:
            qs = qs.filter(awaiting_response_from=request.user, status=BetStatus.PENDING)
        else:
            status_filter = request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)

        qs = qs.order_by("status", "due_date", "-created_at")
        serializer = BetSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class BetListCreateView(APIView):
    """
    GET  /api/groups/{group_id}/bets/  — list bets for a group
    POST /api/groups/{group_id}/bets/  — create a bet
    """

    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get(self, request, group_id):
        bets = Bet.objects.filter(group_id=group_id).select_related(
            "creator", "challenger", "opponent", "winner"
        )
        serializer = BetSerializer(bets, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        is_admin = GroupMembership.objects.filter(
            user=request.user, group=group, role=GroupMembership.Role.GROUP_ADMIN
        ).exists()
        serializer = BetCreateSerializer(
            data=request.data,
            context={"request": request, "group": group},
        )
        serializer.is_valid(raise_exception=True)
        if is_admin:
            bet = serializer.save(group=group, creator=request.user)
        else:
            from apps.users.models import User
            challenger_id = serializer.validated_data["challenger_id"]
            opponent_id = serializer.validated_data["opponent_id"]
            other_id = opponent_id if request.user.pk == challenger_id else challenger_id
            other_user = User.objects.get(pk=other_id)
            bet = serializer.save(
                group=group,
                creator=request.user,
                status=BetStatus.PENDING,
                awaiting_response_from=other_user,
            )
        return Response(BetSerializer(bet, context={"request": request}).data, status=status.HTTP_201_CREATED)


class BetDetailView(APIView):
    """
    GET    /api/groups/{group_id}/bets/{bet_id}/  — bet detail
    PATCH  /api/groups/{group_id}/bets/{bet_id}/  — update bet (creator or admin)
    DELETE /api/groups/{group_id}/bets/{bet_id}/  — cancel/delete bet (admin only)
    """

    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def _get_bet(self, group_id, bet_id):
        return get_object_or_404(Bet, pk=bet_id, group_id=group_id)

    def get(self, request, group_id, bet_id):
        bet = self._get_bet(group_id, bet_id)
        return Response(BetSerializer(bet, context={"request": request}).data)

    def patch(self, request, group_id, bet_id):
        bet = self._get_bet(group_id, bet_id)
        # Only creator or group_admin can edit
        is_admin = GroupMembership.objects.filter(
            user=request.user, group_id=group_id, role=GroupMembership.Role.GROUP_ADMIN
        ).exists()
        if not is_admin and bet.creator != request.user:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if bet.status != BetStatus.OPEN:
            return Response(
                {"detail": "Only open bets can be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Determine which participant must approve this edit
        if request.user.pk == bet.challenger_id:
            other_party = bet.opponent
        elif request.user.pk == bet.opponent_id:
            other_party = bet.challenger
        else:
            # Admin who is not a participant — challenger must approve
            other_party = bet.challenger
        serializer = BetSerializer(bet, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(status=BetStatus.PENDING, awaiting_response_from=other_party)
        return Response(serializer.data)

    def delete(self, request, group_id, bet_id):
        bet = self._get_bet(group_id, bet_id)
        is_admin = GroupMembership.objects.filter(
            user=request.user, group_id=group_id, role=GroupMembership.Role.GROUP_ADMIN
        ).exists()
        if is_admin:
            # Group admin can hard-delete any bet regardless of status
            bet.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        if bet.creator != request.user:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if bet.status not in (BetStatus.OPEN, BetStatus.PENDING):
            return Response(
                {"detail": "Only open or pending bets can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bet.status = BetStatus.CANCELLED
        bet.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResolveBetView(APIView):
    """
    POST /api/groups/{group_id}/bets/{bet_id}/resolve/
    Marks the bet as resolved and records the winner.
    Allowed by: group_admin OR the bet creator.
    """

    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def post(self, request, group_id, bet_id):
        bet = get_object_or_404(Bet, pk=bet_id, group_id=group_id)

        is_admin = GroupMembership.objects.filter(
            user=request.user, group_id=group_id, role=GroupMembership.Role.GROUP_ADMIN
        ).exists()
        is_creator = bet.creator == request.user

        if not (is_admin or is_creator):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        if bet.status != BetStatus.OPEN:
            return Response(
                {"detail": "Only open bets can be resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ResolveBetSerializer(data=request.data, context={"bet": bet})
        serializer.is_valid(raise_exception=True)

        from apps.users.models import User

        winner = User.objects.get(pk=serializer.validated_data["winner_id"])
        bet.winner = winner
        bet.outcome_notes = serializer.validated_data.get("outcome_notes", "")
        bet.status = BetStatus.RESOLVED
        bet.resolved_at = timezone.now()
        bet.resolved_by = request.user
        bet.save()

        return Response(BetSerializer(bet, context={"request": request}).data)


class AcceptBetView(APIView):
    """POST /api/groups/{group_id}/bets/{bet_id}/accept/"""
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def post(self, request, group_id, bet_id):
        bet = get_object_or_404(Bet, pk=bet_id, group_id=group_id)
        if bet.status != BetStatus.PENDING:
            return Response({"detail": "Bet is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        if bet.awaiting_response_from != request.user:
            return Response({"detail": "It is not your turn to respond."}, status=status.HTTP_403_FORBIDDEN)
        bet.status = BetStatus.OPEN
        bet.awaiting_response_from = None
        bet.save(update_fields=["status", "awaiting_response_from"])
        return Response(BetSerializer(bet, context={"request": request}).data)


class RejectBetView(APIView):
    """POST /api/groups/{group_id}/bets/{bet_id}/reject/"""
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def post(self, request, group_id, bet_id):
        bet = get_object_or_404(Bet, pk=bet_id, group_id=group_id)
        if bet.status != BetStatus.PENDING:
            return Response({"detail": "Bet is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        if bet.awaiting_response_from != request.user:
            return Response({"detail": "It is not your turn to respond."}, status=status.HTTP_403_FORBIDDEN)
        bet.status = BetStatus.REJECTED
        bet.awaiting_response_from = None
        bet.save(update_fields=["status", "awaiting_response_from"])
        return Response(BetSerializer(bet, context={"request": request}).data)


class CounterOfferView(APIView):
    """POST /api/groups/{group_id}/bets/{bet_id}/counter/
    Body: {challenger_amount, opponent_amount}
    Swaps awaiting_response_from to the other participant.
    """
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def post(self, request, group_id, bet_id):
        bet = get_object_or_404(Bet, pk=bet_id, group_id=group_id)
        if bet.status != BetStatus.PENDING:
            return Response({"detail": "Bet is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        if bet.awaiting_response_from != request.user:
            return Response({"detail": "It is not your turn to respond."}, status=status.HTTP_403_FORBIDDEN)

        challenger_amount = request.data.get("challenger_amount")
        opponent_amount = request.data.get("opponent_amount")
        if challenger_amount is None or opponent_amount is None:
            return Response({"detail": "challenger_amount and opponent_amount are required."}, status=status.HTTP_400_BAD_REQUEST)

        next_responder = bet.challenger if request.user == bet.opponent else bet.opponent
        bet.challenger_amount = challenger_amount
        bet.opponent_amount = opponent_amount
        bet.awaiting_response_from = next_responder
        bet.save(update_fields=["challenger_amount", "opponent_amount", "awaiting_response_from"])
        return Response(BetSerializer(bet, context={"request": request}).data)
