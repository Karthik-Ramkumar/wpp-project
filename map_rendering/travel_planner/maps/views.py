# Create your views here.
from django.shortcuts import render # type: ignore
import os
import requests
from django.http import JsonResponse # type: ignore
from django.conf import settings # type: ignore
from dotenv import load_dotenv # type: ignore
from django.utils.safestring import mark_safe # type: ignore
import json
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