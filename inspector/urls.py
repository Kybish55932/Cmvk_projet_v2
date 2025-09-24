# from django.urls import path
# from . import views
#
# urlpatterns = [
#     path("inspector/", views.inspector_list, name="inspector_list"),
#     path("", views.inspector_list),  # ← теперь "/" будет вести на инспектора
# ]
from django.urls import path
from . import views

app_name = "inspector"  # обязательно для namespace

urlpatterns = [
    path("inspector/", views.inspector_page, name="inspector_page"),
    path("add_violation/", views.add_violation, name="add_violation"),
    path("edit_violation/<int:id>/", views.edit_violation, name="edit_violation"),
    path("delete_violation/<int:id>/", views.delete_violation, name="delete_violation"),
    path("choices/", views.choices, name="choices"),
    path("database/", views.database_page, name="database_page"),
]



