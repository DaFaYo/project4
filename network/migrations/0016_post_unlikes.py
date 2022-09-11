# Generated by Django 4.0.6 on 2022-09-11 14:30

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0015_remove_post_likes_post_likes'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='unlikes',
            field=models.ManyToManyField(related_name='unliked_posts', to=settings.AUTH_USER_MODEL),
        ),
    ]
