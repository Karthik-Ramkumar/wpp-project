from django.contrib import admin # type: ignore

# Register your models here.

from .models import Trip, Destination

admin.site.register(Trip)
admin.site.register(Destination)