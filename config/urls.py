
from django.contrib import admin
from django.urls import path, include
from app_direction.views import redirect_based_on_group
from users.views import after_login_redirect  # ← правильная функция, не redirect_after_login

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", redirect_based_on_group, name="home"),

    # --- AUTH ---
    path("users/", include(("users.urls", "users"), namespace="users")),
    path("after-login/", after_login_redirect, name="after_login"),  # ✅ правильно подключено

    # --- PANELS ---
    path("inspector/", include("inspector.urls", namespace="inspector")),
    path("supervisor/", include("leadspec.urls")),
    path("rukap/", include("rukap.urls")),
    path("slujba/", include("slujba.urls")),
    path("accountant/", include(("accountant.urls", "accountant"), namespace="accountant")),
    path("viewlist/", include(("viewlist.urls", "viewlist"), namespace="viewlist")),

]