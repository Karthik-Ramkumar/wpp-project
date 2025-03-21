from django.urls import path # type: ignore
from .views import geocode_location
from .views import map_view # importing the map_view function from views.py

urlpatterns = [
    path('', map_view, name='map'), # '' means no additional arguments, map_view (the function in views.py)
    path("geocode/", geocode_location, name="geocode_location"),
]
