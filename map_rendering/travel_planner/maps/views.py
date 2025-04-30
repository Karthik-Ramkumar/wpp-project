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
load_dotenv()
from .models import Trip # type: ignore
from django.shortcuts import render, get_object_or_404 # type: ignore
from django.shortcuts import render # type: ignore
from maps.models import Trip, Destination
from maps.models import Trip, Destination  # Assuming you have a Destination model
import logging
from django.shortcuts import redirect # type: ignore
from django.views.decorators.csrf import csrf_exempt # type: ignore

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")  # Hardcoded API Key


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

def get_google_maps_api_key(request):
    return JsonResponse({"GOOGLE_MAPS_API_KEY": os.getenv("GOOGLE_MAPS_API_KEY")})


def get_user():
    karthik1, created = User.objects.get_or_create(username="karthik1")
    return karthik1

def user_dashboard(request):
    user = request.user  # Always use test_user for now
    trips = Trip.objects.filter(user=request.user) 
    return render(request, "dashboard.html", {"trips": trips})



# @login_required
def trip_list(request):
    trips = Trip.objects.all().values("name", "start_date", "end_date")
    return JsonResponse(list(trips), safe=False)

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

# @login_required
def user_trips(request):
    trips = Trip.objects.filter(user=request.user).values()
    return JsonResponse(list(trips), safe=False)


# @login_required
def home(request):
    user = request.user
    trips = Trip.objects.filter(user=user).order_by('-created_at')

    if trips.exists():
        latest_trip = trips.first()
    else:
        latest_trip = None

    return render(request, "index.html", {"latest_trip": latest_trip})


logger = logging.getLogger(__name__)
# @login_required
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

from django.http import HttpResponse # type: ignore
from .models import Trip, Destination

from django.http import HttpResponse
from .models import Trip, Destination, Expense

def write_summary(request):
    trip = Trip.objects.get(name="trip1")  # or get current trip logic
    destinations = Destination.objects.filter(trip=trip)
    expenses = Expense.objects.filter()


    with open("summary.txt", "w") as f:
        # Write the header section
        f.write("="*70 + "\n")
        f.write(f"{'🌎 Your Ultimate Trip Summary':^70}\n")
        f.write("="*70 + "\n\n")

        # Write trip details
        f.write(f"🏷️  **Trip Name**        : {trip.name}\n")
        f.write(f"📅  **Start Date**       : {trip.start_date.strftime('%B %d, %Y')}\n")
        f.write(f"🏁  **End Date**         : {trip.end_date.strftime('%B %d, %Y')}\n\n")
        
        # Write destinations overview
        f.write("-" * 70 + "\n")
        f.write(f"{'🌍  Destinations Overview':^70}\n")
        f.write("-" * 70 + "\n\n")

        for i, dest in enumerate(destinations, start=1):
            f.write(f"{i}. {dest.name.title():<25} | Latitude: {dest.latitude:<15} | Longitude: {dest.longitude}\n")
        
        # Write the total stops and trip duration
        f.write("\n" + "-" * 70 + "\n")
        f.write(f"✈️  **Total Stops**      : {len(destinations)}\n")
        f.write(f"💼  **Trip Duration**    : {trip.start_date.strftime('%B %d, %Y')} to {trip.end_date.strftime('%B %d, %Y')}\n")
        
        # Write expenses overview
        f.write("\n" + "="*70 + "\n")
        f.write(f"💵  **Expenses Overview**\n")
        f.write("="*70 + "\n\n")
        
        if expenses.exists():
            total_expense = 0
            for expense in expenses:
                f.write(f"🛑  **Stop Name**: {expense.stop_name}\n")
                f.write(f"💸  **Expense** : ₹{expense.expense}\n")
                if expense.note:
                    f.write(f"📝  **Note**    : {expense.note}\n")
                f.write("-" * 70 + "\n")
                total_expense += expense.expense

            f.write(f"\n**Total Expenses**: ₹{total_expense}\n")
        else:
            f.write("No expenses recorded for this trip.\n")
        
        # Closing the summary
        f.write("\n" + "="*70 + "\n")
        f.write(f"🌟 **Have a great trip!** 🌟\n")
        f.write(f"📸 Don’t forget to capture memories at each stop!\n")
        f.write("="*70 + "\n")

    return HttpResponse("Summary written to summary.txt")

'''def auto_login(request):
    user = User.objects.get(username="karthik1")
    user.backend = 'django.contrib.auth.backends.ModelBackend'  # Set backend manually
    login(request, user)  # Log the user in
    return redirect('/')  # Redirect to the home page'''


'''def whoami(request):
    if request.user.is_authenticated:
        return JsonResponse({"username": request.user.username})
    return JsonResponse({"error": "Not logged in"}, status=401)'''

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Expense

@csrf_exempt  # You can use the CSRF token from the frontend to bypass the need for this decorator
def add_expense(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        stop_name = data.get('stop_name')
        expense = data.get('expense')
        note = data.get('note', '')

        # Save the new expense
        new_expense = Expense.objects.create(
            stop_name=stop_name,
            expense=expense,
            note=note,
        )

        # Return the saved expense as JSON to update the frontend
        return JsonResponse({
            'stop_name': new_expense.stop_name,
            'expense': new_expense.expense,
            'note': new_expense.note,
        })

def get_expenses(request):
    expenses = Expense.objects.all()
    expenses_data = [{
        'stop_name': expense.stop_name,
        'expense': expense.expense,
        'note': expense.note,
    } for expense in expenses]

    total_cost = sum(expense['expense'] for expense in expenses_data)

    return JsonResponse({
        'expenses': expenses_data,
        'total_cost': total_cost,
    })