from django.urls import path
from . import views

app_name = "inspector"

urlpatterns = [
    # HTML-страница
    path("inspector/", views.inspector_page, name="inspector_page"),

    # JSON API
    path("list/", views.inspector_list, name="inspector_list_api"),

    # CRUD
    path("add_violation/", views.add_violation, name="add_violation"),
    path("edit_violation/<int:id>/", views.edit_violation, name="edit_violation"),
    path("delete_violation/<int:id>/", views.delete_violation, name="delete_violation"),

    # Прочее
    path("choices/", views.choices, name="choices"),
    path("database/", views.database_page, name="database_page"),
    path("violations-by-week/", views.violations_by_week, name="violations_by_week"),
    path("send-for-approval/", views.send_for_approval, name="send_for_approval"),
]
