
from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts", views.posts, name="posts"),
    path("posts/<int:post_id>", views.posts, name="posts"),
    path("profiles/<int:user_id>", views.profile, name="profile"),
    path("following", views.following, name="following")
]
