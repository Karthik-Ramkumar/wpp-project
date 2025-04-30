from django.db import models # type: ignore

# Create your models here.
from django.contrib.auth.models import User   # type: ignore # Import User model

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Destination(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="destinations")
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_substop = models.BooleanField(default=False)
    order = models.IntegerField(default = 0)  # To store order of stops

    def __str__(self):
        return f"{self.name} ({self.trip.name})"

from django.db import models

class Expense(models.Model):
    stop_name = models.CharField(max_length=200)
    expense = models.FloatField()
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.stop_name}: ₹{self.expense}"
