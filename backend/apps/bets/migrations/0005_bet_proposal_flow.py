import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bets", "0004_currency_model"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="bet",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("open", "Open"),
                    ("rejected", "Rejected"),
                    ("resolved", "Resolved"),
                    ("cancelled", "Cancelled"),
                ],
                default="open",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="bet",
            name="awaiting_response_from",
            field=models.ForeignKey(
                blank=True,
                help_text="User whose turn it is to accept/reject/counter this proposal.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pending_bets",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
