# leadspec/urls.py
from django.urls import path
from . import views

app_name = "leadspec"

urlpatterns = [
    path("", views.leadspec_list, name="leadspec_list"),
    # JSON API
    path("api/violations/", views.api_list, name="api_list"),
    path("api/violations/create/", views.api_create, name="api_create"),
    path("api/violations/<int:pk>/", views.api_update, name="api_update"),
    path("api/violations/<int:pk>/delete/", views.api_delete, name="api_delete"),
]
