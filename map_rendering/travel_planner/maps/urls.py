from django.urls import path # type: ignore
from .views import geocode_location
from .views import map_view # importing the map_view function from views.py
from .views import trip_list
from .views import auto_login
from .views import whoami
from .views import home
from .views import get_trips
from . import views


urlpatterns = [
    path('', map_view, name='map'), # '' means no additional arguments, map_view (the function in views.py)
    path("geocode/", geocode_location, name="geocode_location"),
    path("trips/", trip_list, name="trip_list"),
    path('autologin/', auto_login, name='autologin'),
    path('whoami/', whoami, name='whoami'),
    path("trips/", views.user_trips, name="user_trips"),
    path("", home, name="home"),
    path('api/get_trips/', get_trips, name='get_trips'),
]
