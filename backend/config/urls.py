"""
Root URL configuration.
All API routes are prefixed with /api/.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.bets.views import MyBetsView, CurrencyListView, CurrencyDetailView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/groups/", include("apps.groups.urls")),
    path("api/bets/my/", MyBetsView.as_view(), name="my-bets"),
    path("api/currencies/", CurrencyListView.as_view(), name="currencies"),
    path("api/currencies/<str:code>/", CurrencyDetailView.as_view(), name="currency-detail"),
    # dj-rest-auth social login endpoints
    path("api/auth/social/", include("allauth.socialaccount.urls")),
    # API docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
