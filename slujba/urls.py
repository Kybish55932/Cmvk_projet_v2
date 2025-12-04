from django.urls import path
from . import views

urlpatterns =  [
    path("", views.slujba_list, name="slujba_list"),
    path("update/<int:id>/", views.update_violation, name="update_violation"),
]
