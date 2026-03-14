from django.db import migrations, models


INITIAL_CURRENCIES = [
    ("EUR", "Euro (€)", "€"),
    ("GBP", "British Pound (£)", "£"),
    ("ILS", "Israeli Shekel (₪)", "₪"),
    ("USD", "US Dollar ($)", "$"),
]


def seed_currencies(apps, schema_editor):
    Currency = apps.get_model("bets", "Currency")
    for code, name, symbol in INITIAL_CURRENCIES:
        Currency.objects.get_or_create(code=code, defaults={"name": name, "symbol": symbol})


class Migration(migrations.Migration):

    dependencies = [
        ("bets", "0003_split_amount_into_challenger_opponent"),
    ]

    operations = [
        migrations.CreateModel(
            name="Currency",
            fields=[
                ("code", models.CharField(max_length=10, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=100)),
                ("symbol", models.CharField(blank=True, default="", max_length=5)),
            ],
            options={
                "verbose_name_plural": "currencies",
                "ordering": ["code"],
            },
        ),
        migrations.AlterField(
            model_name="bet",
            name="currency",
            field=models.CharField(default="ILS", max_length=10),
        ),
        migrations.RunPython(seed_currencies, migrations.RunPython.noop),
    ]
