from django.urls import path

from . import views

app_name = "viewlist"

urlpatterns = [
    path("", views.all_violations_list, name="all_violations_list"),
]
