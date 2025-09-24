from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import CustomUser  # ← Импортируйте CustomUser

class LoginUserForm(AuthenticationForm):
    username = forms.CharField(label='Логин', widget=forms.TextInput(attrs={'class': 'form-input'}))
    password = forms.CharField(label='Пароль', widget=forms.PasswordInput(attrs={'class': 'form-input'}))

    class Meta:
        model = CustomUser  # ← Измените на CustomUser
        fields = ['username', 'password']