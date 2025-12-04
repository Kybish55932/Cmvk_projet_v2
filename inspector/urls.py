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
    path("weekly-report/", views.weekly_report_page, name="weekly_report"),
    path("weekly-report/agree/", views.agree_week, name="weekly_report_agree"),
    path("api/weekly_violations/", views.api_weekly_violations, name="api_weekly_violations"),
    path("send_for_approval/<int:id>/", views.send_for_approval, name="send_for_approval"),
    path("send_week/", views.send_week, name="send_week"),
]
