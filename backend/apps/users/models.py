from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model.
    Username is kept for admin use; email is the primary identifier.
    Avatar URL is populated from OAuth providers.
    """

    email = models.EmailField(unique=True)
    avatar_url = models.URLField(blank=True, default="")
    nickname = models.CharField(max_length=50, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
