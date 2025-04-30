from django.contrib import admin # type: ignore

# Register your models here.

from .models import Trip, Destination,Expense

admin.site.register(Trip)
admin.site.register(Destination)
admin.site.register(Expense)