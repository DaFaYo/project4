
from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts", views.post, name="post"),
    path("posts/<int:post_id>", views.post, name="post"),
    path("profiles/<int:user_id>", views.profile, name="profile")
]
