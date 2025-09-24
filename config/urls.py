from django.contrib import admin
from django.urls import path, include
from app_direction.views import redirect_based_on_group

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", redirect_based_on_group, name="home"),
    path("users/", include(("users.urls", "users"), namespace="users")),
    path("inspector/", include("inspector.urls", namespace="inspector")),
    path('supervisor/', include('leadspec.urls')),
]