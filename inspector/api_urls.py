from django.urls import path, include
from rest_framework.routers import DefaultRouter

from app_direction.decorators import inspectors_required
from .views import ViolationViewSet
from inspector import api_views
router = DefaultRouter()
router.register(r"violations", ViolationViewSet, basename="violation")

urlpatterns = [
    path('violations/', inspectors_required(api_views.violation_list), name='api_violations'),
    path('violations/<int:pk>/', inspectors_required(api_views.violation_detail), name='api_violation_detail'),
    path("", include(router.urls)),
]
