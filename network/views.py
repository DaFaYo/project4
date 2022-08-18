from http.client import HTTPResponse
import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist, BadRequest
from django.views.defaults import page_not_found, bad_request


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



def compose(request):

    if request.method == "POST":

        if not request.user.is_authenticated:
            return JsonResponse({"error": "You have to be logged in to post a message."}, status=401)


        data = json.loads(request.body)
        body = data.get("body")
        if body == "":
            return JsonResponse({"error": "Post can't be empty."}, status=400)


        Post.objects.create(user=request.user, body=body)
        return JsonResponse({"message": "Email sent successfully."}, status=201)
    
    # Return emails in reverse chronologial order
    posts = Post.objects.all().order_by("-timestamp")
    return JsonResponse([post.serialize() for post in posts], safe=False)


# TODO: make this work without the csrf_exempt decorator
@csrf_exempt
@login_required
def profile(request, user_id):
    user = None
    try:

        user = User.objects.get(pk=user_id)

    except ObjectDoesNotExist as e:
        return page_not_found(request, e)

     # Return email contents
    if request.method == "GET":

        # Check if the user that is logged in, is following the user
        # of which profile he's looking at
        logged_in_user = request.user.following.all().filter(id = user.id)

        is_following = logged_in_user.exists() and (logged_in_user.get() == user)
        
        profile_dict = user.serialize()
        profile_dict["number_of_followers"] = user.followers.count()
        profile_dict["following"] = is_following
        return JsonResponse(profile_dict, safe=False)     

    # Update whether profile should be followed
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("following") is not None:

            # TODO: remove the user from the following list for the user that is signed in.
            # or vice versa
            user.following = data["following"]
            user.save()
        return HTTPResponse(status=204)

    # Profile must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


      