# rukap/urls.py
from django.urls import path
from . import views

app_name = "rukap"

urlpatterns = [
    path("", views.rukap_list, name="list"),
    path("api/", views.api_week, name="api_week"),
    path("agreed/", views.agreed_violations, name="agreed"),
]
