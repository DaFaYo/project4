# Generated by Django 4.0.6 on 2022-09-10 17:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0011_remove_post_last_updated'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='last_updated',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
