from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Populates avatar_url and name from the OAuth provider after login.
    """

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        extra_data = sociallogin.account.extra_data

        picture = extra_data.get("picture") or extra_data.get("avatar_url", "")
        if picture:
            user.avatar_url = picture

        if not user.first_name:
            user.first_name = extra_data.get("given_name", "")
        if not user.last_name:
            user.last_name = extra_data.get("family_name", "")

        user.save(update_fields=["avatar_url", "first_name", "last_name"])
        return user
