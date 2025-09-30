from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse, reverse_lazy
from .forms import LoginUserForm


class LoginUser(LoginView):
    form_class = LoginUserForm  # ← Используйте вашу форму
    template_name = 'users/login.html'
    extra_context = {'title': "Авторизация"}

    def get_success_url(self):
        # Перенаправляем в зависимости от группы
        user = self.request.user
        if user.is_in_group('supervisor'):
            return reverse_lazy('leadspec:supervisor_page')
        elif user.is_in_group('Inspectors -1') or user.is_in_group('Inspectors -2'):
            return reverse_lazy('inspector:inspector_list')
        elif user.is_superuser or user.is_staff:
            return reverse_lazy('admin:index')
        else:
            return reverse_lazy('leadspec:leadspec_list')


def logout_user(request):
    logout(request)
    return HttpResponseRedirect(reverse('users:login'))

# Удалите старую функцию login_user, т.к. у вас есть класс LoginUser
# def login_user(request): ...