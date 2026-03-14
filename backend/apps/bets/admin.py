from django.contrib import admin
from .models import Bet, Currency


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "symbol"]
    search_fields = ["code", "name"]


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ["title", "group", "challenger", "opponent", "challenger_amount", "opponent_amount", "currency", "status", "created_at"]
    list_filter = ["status", "currency", "group"]
    search_fields = ["title", "challenger__email", "opponent__email"]
    readonly_fields = ["created_at", "updated_at", "resolved_at"]
