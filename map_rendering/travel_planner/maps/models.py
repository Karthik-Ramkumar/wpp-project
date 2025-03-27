from django.db import models

# Create your models here.
from django.db import models

from django.db import models
from django.contrib.auth.models import User  # Import User model

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Add this line
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    travel_mode = models.CharField(max_length=50)  # e.g., Car, Train, Flight
    total_travel_time = models.DurationField(null=True, blank=True)  # Total time
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Destination(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="destinations")
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_substop = models.BooleanField(default=False)
    order = models.IntegerField()  # To store order of stops
    distance_from_previous = models.FloatField(null=True, blank=True)  # in km
    travel_time_from_previous = models.DurationField(null=True, blank=True)  # Time between stops

    def __str__(self):
        return f"{self.name} ({self.trip.name})"
