import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from .models import Post, User



def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def posts(request, post_id = None):

    if request.method == "POST":

        if not request.user.is_authenticated:
            return JsonResponse({"error": "You have to be logged in to post a message."}, status=401)

        data = json.loads(request.body)
        body = data.get("body")
        if body == "":
            return JsonResponse({"error": "Post can't be empty."}, status=400)


        Post.objects.create(user=request.user, body=body)
        return JsonResponse({"message": "Post sent successfully."}, status=201)

    # Logged-in users can edit their own posts 
    if request.method == "PUT" and (post_id is not None):
        data = json.loads(request.body)
        if data.get("post_body"):
            return post_edit(request, post_id)

        if data.get("like_body"): 
            return update_likes(request, post_id) 
      
    if post_id is not None:
        try:

            post = Post.objects.get(pk=post_id)
            return JsonResponse(post.serialize(), safe=False)

        except ObjectDoesNotExist:
            return JsonResponse({
                "error": "Post not found."
        }, status=404)

    # Return posts in reverse chronologial order
    posts = Post.objects.all().order_by("-timestamp")
    return make_post_json_response(request, posts)


@ensure_csrf_cookie
@login_required
def post_edit(request, post_id):
    post = None
    try:

        post = Post.objects.get(pk=post_id)

    except ObjectDoesNotExist:
            return JsonResponse({
                "error": "Post not found."
        }, status=404)

    if (request.user != post.user):
        return JsonResponse({
            "error": "Unauthorized. Only the creater of the original post can edit the post."
        }, status=401)

    data = json.loads(request.body)
    new_post_body = data.get("post_body")
    post.body = new_post_body
    post.save()
    return HttpResponse(status=204)


@ensure_csrf_cookie
@login_required
def update_likes(request, post_id):
    post = None
    try:

        post = Post.objects.get(pk=post_id)

    except ObjectDoesNotExist:
            return JsonResponse({
                "error": "Post not found."
        }, status=404)

    data = json.loads(request.body)
    like_unlike = data.get("like_body")

    if like_unlike:
        option = like_unlike.lower()
        if option == "like" or option == "unlike":

            # User can't like/unlike their own posts
            if request.user == post.user:
                return HttpResponse(status=200)

            # Check if the post is already liked by the logged in user.
            liked_post = request.user.liked_posts.all().filter(id=post.id)
            # Check if the post is already unliked by the logged in user.
            unliked_post = request.user.unliked_posts.all().filter(id=post.id)


            if option == "unlike" and not unliked_post.exists():
                post.unlikes.add(request.user)

                if liked_post.exists():
                    post.likes.remove(request.user)

                post.save()
                return HttpResponse(status=204)

            if option == "like" and not liked_post.exists():
                post.likes.add(request.user)

                if unliked_post.exists():
                    post.unlikes.remove(request.user)

                post.save()
                return HttpResponse(status=204)

        # No updates necessary
        return HttpResponse(status=200)        

    else:
        return JsonResponse({
            "error": "Invalid option. Choose either Like or Unlike."
        }, status=400)


@ensure_csrf_cookie
@login_required
def profile(request, user_id):
    user = None
    try:

        user = User.objects.get(pk=user_id)

    except ObjectDoesNotExist:
            return JsonResponse({
                "error": "User not found."
        }, status=404)

     # Return email contents
    if request.method == "GET":

        # Check if the user that is logged in, is following the user
        # of which profile he's looking at
        logged_in_user = request.user.following.all().filter(id = user.id)

        profile_dict = user.serialize()
        if (request.user != user):
            is_following = logged_in_user.exists() and (logged_in_user.get() == user)
            profile_dict["following"] = is_following
        
        profile_dict["number_of_followers"] = user.followers.count()
        return JsonResponse(profile_dict, safe=False)     

    # Update whether user should be followed/unfollowed
    elif request.method == "PUT":
        data = json.loads(request.body)
        follow = data.get("following")
        if (follow is not None) and (request.user != user):
            if follow:
                request.user.following.add(user)
            else:
                request.user.following.remove(user)    
            user.save()
        return HttpResponse(status=204)

    # Profile must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400) 


@login_required
def following(request):
    
    following_users = request.user.following.all()
    posts = Post.objects.filter(user__in=following_users).order_by("-timestamp")
    return make_post_json_response(request, posts)
    
    
def make_post_json_response(request, posts_list):

    try:
        page_number = int(request.GET.get('page', '1'))
        page_number = page_number if page_number > 0 else 1
    
    except ValueError:
        page_number = 1

    # show 10 posts per page
    paginator = Paginator(posts_list, 10)
    page_obj = paginator.get_page(page_number)
   
    post_response = {}
    post_response["posts"] = [post.serialize() for post in page_obj.object_list]
    post_response["paginator"] = {
        "page_number": page_obj.number,
        "num_pages": page_obj.paginator.num_pages,
        "has_previous": page_obj.has_previous(),
        "previous_page_number": page_obj.previous_page_number() if page_obj.has_previous() else None,
        "has_next": page_obj.has_next(),
        "next_page_number": page_obj.next_page_number() if page_obj.has_next() else None,

    } 

    if request.user and request.user.is_authenticated:
        post_response["logged_in_user"] = {
            "username": request.user.username,
            "user_id": request.user.id
        }

    return JsonResponse(post_response, safe=False)
