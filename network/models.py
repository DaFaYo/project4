from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):     
    following = models.ManyToManyField("self", blank=True, symmetrical=False, related_name="followers")

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "number_of_following": self.following.count()
        }

    def __str__(self):
        return f"id: {self.id}, username: {self.username}"


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True, blank=True, null=True)

    def serialize(self):
        return {
            "id": self.id,
            "poster": self.user.username,
            "poster_id": self.user.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.likes,
            "last_updated": self.last_updated
        }

    def __str__(self):
        return f"id: {self.id}, poster: {self.user.username}, timestamp: {self.timestamp}"    