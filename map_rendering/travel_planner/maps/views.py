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
# from django.contrib.auth.models import User # type: ignore
load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")  # Hardcoded API Key


# from django.contrib.auth.decorators import login_required

# @login_required
def map_view(request):
    user = request.user
    trip = Trip.objects.filter(user=user).order_by('-created_at').first()

    stops = []
    if trip:
        destinations = Destination.objects.filter(trip=trip)
        stops = [
            {"name": d.name, "lat": float(d.latitude), "lng": float(d.longitude)}
            for d in destinations
        ]

    return render(request, "maps/test1.html", {
        "stops": mark_safe(json.dumps(stops)),
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
# from django.contrib.auth.models import User # type: ignore

def get_user():
    karthik1, created = User.objects.get_or_create(username="karthik1")
    return karthik1

def user_dashboard(request):
    user = request.user  # Always use test_user for now
    trips = Trip.objects.filter(user=request.user) 
    return render(request, "dashboard.html", {"trips": trips})

from django.shortcuts import render # type: ignore
from maps.models import Trip
# from django.contrib.auth.decorators import login_required # type: ignore

# @login_required
def trip_list(request):
    trips = Trip.objects.all().values("name", "start_date", "end_date")
    return JsonResponse(list(trips), safe=False)

from maps.models import Trip, Destination

from django.http import JsonResponse
# from django.contrib.auth.decorators import login_required


def get_trips(request): # this is get stops
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
# from django.contrib.auth import login # type: ignore
# from django.contrib.auth.models import User # type: ignore

'''def auto_login(request):
    user = User.objects.get(username="karthik1")
    user.backend = 'django.contrib.auth.backends.ModelBackend'  # Set backend manually
    login(request, user)  # Log the user in
    return redirect('/')  # Redirect to the home page'''


'''def whoami(request):
    if request.user.is_authenticated:
        return JsonResponse({"username": request.user.username})
    return JsonResponse({"error": "Not logged in"}, status=401)'''

from django.http import JsonResponse # type: ignore
# from django.contrib.auth.decorators import login_required # type: ignore
from .models import Trip

# @login_required
def user_trips(request):
    trips = Trip.objects.filter(user=request.user).values()
    return JsonResponse(list(trips), safe=False)

from django.shortcuts import render # type: ignore
# from django.contrib.auth.decorators import login_required # type: ignore
from .models import Trip

# @login_required
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

import json
import logging
from django.http import JsonResponse
# from django.contrib.auth.decorators import login_required
from maps.models import Trip, Destination

logger = logging.getLogger(__name__)

# @login_required
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
def save_stop(request):
    logger.debug("save_stop function called") 
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        # trip_id = data.get("trip_id")
        stop_name = data.get("name")
        lat = data.get("lat")
        lng = data.get("lng")
        # isSubstop = data.get("isSubstop")

        if not (stop_name and lat and lng): # removed trip_id
            logger.error("Missing required fields")
            return JsonResponse({"error": "Missing required fields"}, status=400)

        trip = Trip.objects.filter(user=request.user).first()
        if not trip:
            logger.error(f"{request.user} not found {request.user}")
            return JsonResponse({"error": "Trip not found"}, status=404)

        destination = Destination.objects.create(
            trip=trip, name=stop_name, latitude=float(lat), longitude=float(lng)
        )

        logger.info(f"Destination '{destination.name}' added to trip '{trip.name}'")
        return JsonResponse({"message": "Destination added", "id": destination.id}, status=201)
    except json.JSONDecodeError:
        logger.error("Invalid JSON data received")
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        logger.exception(f"Error adding destination: {str(e)}")
        return JsonResponse({"error": "Internal server error"}, status=500)


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def delete_stop(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        stop_name = data.get('stop')  # Ensure this matches the JS key

        if stop_name:
            # replace this with your model and logic
            from .models import Destination  # or your model name
            # Assuming the field is `name` in the `Destination` model
            Destination.objects.filter(name=stop_name).delete()  # Use correct field name
            return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'error'}, status=400)