from django.urls import path
from . import views

app_name = "accountant"

urlpatterns = [
    # Страница панели
    path("", views.accountant_list, name="accountant_page"),

]
