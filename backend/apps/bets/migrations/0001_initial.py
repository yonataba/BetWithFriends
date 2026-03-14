import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("groups", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Bet",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, default="")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(
                    choices=[
                        ("ILS", "Israeli Shekel (₪)"),
                        ("USD", "US Dollar ($)"),
                        ("EUR", "Euro (€)"),
                        ("GBP", "British Pound (£)"),
                    ],
                    default="ILS",
                    max_length=3,
                )),
                ("event_date", models.DateTimeField(blank=True, null=True)),
                ("due_date", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(
                    choices=[
                        ("open", "Open"),
                        ("resolved", "Resolved"),
                        ("cancelled", "Cancelled"),
                    ],
                    default="open",
                    max_length=20,
                )),
                ("outcome_notes", models.TextField(blank=True, default="")),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("challenger", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="challenged_bets",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("creator", models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="created_bets",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("group", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="bets",
                    to="groups.group",
                )),
                ("opponent", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="opponent_bets",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("resolved_by", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="resolved_bets",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("winner", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="won_bets",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
