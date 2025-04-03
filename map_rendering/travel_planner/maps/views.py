# Create your views here.
from django.shortcuts import render # type: ignore
import os
import requests
from django.http import JsonResponse # type: ignore
from django.conf import settings # type: ignore
from dotenv import load_dotenv # type: ignore
from django.utils.safestring import mark_safe # type: ignore
import json
from maps.models import Trip
from django.contrib.auth.models import User # type: ignore
load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")  # Hardcoded API Key


def map_view(request):
    stops = request.session.get("stops", [])

    if request.method == "POST":
        location = request.POST.get("location")
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location}&key={API_KEY}"
        response = requests.get(url).json()

        if response["status"] == "OK":
            lat = response["results"][0]["geometry"]["location"]["lat"]
            lng = response["results"][0]["geometry"]["location"]["lng"]
            stops.append({"name": location, "lat": lat, "lng": lng})
            request.session["stops"] = stops

    return render(request, "maps/test1.html", {
        "stops": mark_safe(json.dumps(stops)),  # Convert stops to JSON safely
        "api_key": API_KEY
    })

def geocode_location(request):
    place = request.GET.get("place")
    if not place:
        return JsonResponse({"error": "No place provided"}, status=400)

    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={place}&key={API_KEY}"
    response = requests.get(url).json()

    if response["status"] == "OK":
        location = response["results"][0]["geometry"]["location"]
        return JsonResponse({"lat": location["lat"], "lng": location["lng"]})

    return JsonResponse({"error": "Location not found"}, status=404)

from django.http import JsonResponse # type: ignore
import os

def get_google_maps_api_key(request):
    return JsonResponse({"GOOGLE_MAPS_API_KEY": os.getenv("GOOGLE_MAPS_API_KEY")})

from django.shortcuts import render, get_object_or_404 # type: ignore
from .models import Trip # type: ignore
from django.contrib.auth.models import User # type: ignore

def get_test_user():
    test_user, created = User.objects.get_or_create(username="test_user")
    return test_user

def user_dashboard(request):
    user = get_test_user()  # Always use test_user for now
    trips = Trip.objects.filter(user=user)  # Fetch only test_user's trips
    return render(request, "dashboard.html", {"trips": trips})

from django.shortcuts import render # type: ignore
from maps.models import Trip
from django.contrib.auth.decorators import login_required # type: ignore

@login_required
def trip_list(request):
    trips = Trip.objects.filter(user=request.user)  # Fetch trips for logged-in user
    return render(request, "maps/trip_list.html", {"trips": trips})

from maps.models import Trip, Destination

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
@login_required
def get_trips(request):
    trips = Trip.objects.filter(user=request.user)
    trips_data = []
    for trip in trips:
        destinations_data = []
        for dest in trip.destinations.all():
            if not dest.latitude or not dest.longitude:
                print(f"Invalid destination: {dest}")  # Debug: Check invalid destinations
                continue
            destinations_data.append({
                "name": dest.name,
                "lat": float(dest.latitude),
                "lng": float(dest.longitude),
            })
        trips_data.append({
            "name": trip.name,
            "start_date": str(trip.start_date),
            "end_date": str(trip.end_date),
            "destinations": destinations_data,
        })
    return JsonResponse({"trips": trips_data})

from django.shortcuts import redirect # type: ignore
from django.contrib.auth import login # type: ignore
from django.contrib.auth.models import User # type: ignore

def auto_login(request):
    user = User.objects.get(username="test_user")
    user.backend = 'django.contrib.auth.backends.ModelBackend'  # Set backend manually
    login(request, user)  # Log the user in
    return redirect('/')  # Redirect to the home page


def whoami(request):
    if request.user.is_authenticated:
        return JsonResponse({"username": request.user.username})
    return JsonResponse({"error": "Not logged in"}, status=401)

from django.http import JsonResponse # type: ignore
from django.contrib.auth.decorators import login_required # type: ignore
from .models import Trip

@login_required
def whoami(request):
    return JsonResponse({"username": request.user.username})

@login_required
def user_trips(request):
    trips = Trip.objects.filter(user=request.user).values()
    return JsonResponse(list(trips), safe=False)

from django.shortcuts import render # type: ignore
from django.contrib.auth.decorators import login_required # type: ignore
from .models import Trip

@login_required
def home(request):
    user = request.user
    trips = Trip.objects.filter(user=user).order_by('-created_at')

    if trips.exists():
        latest_trip = trips.first()
    else:
        latest_trip = None

    return render(request, "index.html", {"latest_trip": latest_trip})

from django.http import JsonResponse
from maps.models import Trip, Destination  # Assuming you have a Destination model

@login_required
def save_stop(request):
    if request.method == "POST":
        data = json.loads(request.body)
        print(f"Received data: {data}")  # Debug: Print received data
        trip_id = data.get("trip_id")
        stop_name = data.get("name")
        lat = data.get("lat")
        lng = data.get("lng")
        print(f"Saving stop: {stop_name}, Lat: {lat}, Lng: {lng}")

        if not (trip_id and stop_name and lat and lng):
            print("Invalid data")  # Debug: Print invalid data message
            return JsonResponse({"error": "Invalid data"}, status=400)

        try:
            trip = Trip.objects.get(id=trip_id, user=request.user)
            trip.destinations.create(name=stop_name, latitude=lat, longitude=lng)
            print(f"Stop saved: {stop_name}")  # Debug: Print saved stop
            return JsonResponse({"success": True})
        except Trip.DoesNotExist:
            print("Trip not found")  # Debug: Print trip not found message
            return JsonResponse({"error": "Trip not found"}, status=404)