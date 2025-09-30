from django.urls import path
from . import views

app_name = "rukap"

urlpatterns = [
    path("", views.rukap_list, name="rukap_list"),
    path("agreed/", views.agreed_violations, name="agreed_violations"),
]

