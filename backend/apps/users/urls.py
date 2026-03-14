from django.urls import path, include
from dj_rest_auth.views import LoginView, LogoutView, PasswordChangeView
from dj_rest_auth.registration.views import RegisterView, SocialLoginView
from rest_framework_simplejwt.views import TokenRefreshView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback
from .views import CurrentUserView

logger = logging.getLogger(__name__)


class GoogleLoginView(SocialLoginView):
    """Accepts a Google OAuth2 access token and returns JWT tokens."""
    adapter_class = GoogleOAuth2Adapter

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.error("GoogleLoginView error: %s\n%s", e, traceback.format_exc())
            raise


urlpatterns = [
    # JWT helpers
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Standard auth (email/password — available for future use)
    path("login/", LoginView.as_view(), name="rest_login"),
    path("logout/", LogoutView.as_view(), name="rest_logout"),
    path("register/", RegisterView.as_view(), name="rest_register"),
    path("password/change/", PasswordChangeView.as_view(), name="rest_password_change"),
    # Social auth
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    # Current user
    path("me/", CurrentUserView.as_view(), name="current_user"),
]
