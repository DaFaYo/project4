from django.contrib import admin

from .models import User, Post

class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email")
    filter_horizontal = ("following", )


class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "timestamp", "likes")   


# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)