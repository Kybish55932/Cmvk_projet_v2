from django.urls import path
from . import views

app_name = "leadspec"   # 👈 лучше назвать так, а не leadspec

urlpatterns = [
    # Страница панели
    path("", views.supervisor_page, name="supervisor_page"),

    # API
    path("api/violations/", views.api_list, name="api_list"),
    path("api/violations/create/", views.api_create, name="api_create"),
    path("api/violations/<int:id>/", views.api_update, name="api_update"),
    path("api/violations/<int:id>/delete/", views.api_delete, name="api_delete"),
]
