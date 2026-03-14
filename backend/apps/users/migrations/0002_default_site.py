"""
Ensures the default django.contrib.sites Site object (id=1)
has the correct domain for allauth.
Run automatically on `migrate`.
"""
from django.db import migrations


def create_default_site(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    Site.objects.update_or_create(
        id=1,
        defaults={"domain": "localhost", "name": "BetWithFriends (local)"},
    )


class Migration(migrations.Migration):
    dependencies = [
        ("sites", "0002_alter_domain_unique"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_site, migrations.RunPython.noop),
    ]
