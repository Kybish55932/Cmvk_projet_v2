from django.contrib.auth.views import LogoutView, LoginView
from django.urls import path

from app_direction.decorators import supervisor_required
from . import views

app_name = 'users'
urlpatterns = [
    path("login/", LoginView.as_view(template_name="users/login.html"), name="login"),
    path("logout/", LogoutView.as_view(next_page="/users/login/"), name="logout"),
]