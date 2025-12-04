from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from .forms import LoginUserForm


class LoginUser(LoginView):
    """Стандартная страница авторизации"""
    form_class = LoginUserForm
    template_name = 'users/login.html'
    extra_context = {'title': "Авторизация"}


@login_required
def after_login_redirect(request):
    """Редирект пользователя после логина по его роли"""
    user = request.user

    # если это начальник службы
    if hasattr(user, "service_head"):
        return redirect("/slujba/")

    # если это инспектор
    elif user.groups.filter(name="inspector").exists():
        return redirect("/inspector/inspector")

    # если это старшая смена (supervisor)
    elif user.groups.filter(name="supervisor").exists():
        return redirect("/supervisor/")
        # если это бухгалтер
    elif user.groups.filter(name="accountant").exists():
        return redirect("/accountant/")

    # если админ или другой тип
    return redirect("/admin/")


def logout_user(request):
    """Выход пользователя"""
    logout(request)
    return HttpResponseRedirect(reverse('users:login'))