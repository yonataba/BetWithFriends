from django.urls import path
from .views import (
    GroupListCreateView,
    GroupDetailView,
    GroupMembersView,
    JoinByCodeView,
    RegenerateInviteCodeView,
    RemoveMemberView,
    UpdateMemberRoleView,
)
from apps.bets.views import BetListCreateView, BetDetailView, ResolveBetView, AcceptBetView, RejectBetView, CounterOfferView

urlpatterns = [
    path("", GroupListCreateView.as_view(), name="group-list-create"),
    path("join/", JoinByCodeView.as_view(), name="group-join-by-code"),
    path("<int:pk>/", GroupDetailView.as_view(), name="group-detail"),
    path("<int:group_id>/regenerate-code/", RegenerateInviteCodeView.as_view(), name="group-regenerate-code"),
    path("<int:group_id>/members/", GroupMembersView.as_view(), name="group-members"),
    path(
        "<int:group_id>/members/<int:user_id>/",
        UpdateMemberRoleView.as_view(),
        name="group-member-role",
    ),
    path(
        "<int:group_id>/members/<int:user_id>/remove/",
        RemoveMemberView.as_view(),
        name="group-member-remove",
    ),
    # Bets nested under groups
    path("<int:group_id>/bets/", BetListCreateView.as_view(), name="bet-list-create"),
    path("<int:group_id>/bets/<int:bet_id>/", BetDetailView.as_view(), name="bet-detail"),
    path(
        "<int:group_id>/bets/<int:bet_id>/resolve/",
        ResolveBetView.as_view(),
        name="bet-resolve",
    ),
    path(
        "<int:group_id>/bets/<int:bet_id>/accept/",
        AcceptBetView.as_view(),
        name="bet-accept",
    ),
    path(
        "<int:group_id>/bets/<int:bet_id>/reject/",
        RejectBetView.as_view(),
        name="bet-reject",
    ),
    path(
        "<int:group_id>/bets/<int:bet_id>/counter/",
        CounterOfferView.as_view(),
        name="bet-counter",
    ),
]
