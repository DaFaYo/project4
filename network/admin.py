from django.contrib import admin

from .models import User, Post

class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email")
    filter_horizontal = ("following", )


class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "timestamp", "get_likes")   

    @admin.display(ordering='post__likes', description='Likes')
    def get_likes(self, obj):
        return obj.likes.count()


# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)