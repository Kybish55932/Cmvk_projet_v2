from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

@login_required
def redirect_based_on_group(request):
    user = request.user

    if user.groups.filter(name='Senior shift').exists():
        return redirect('leadspec:supervisor_page')   # 👈 поменяли здесь
    elif user.groups.filter(name='Inspectors -1').exists() or user.groups.filter(name='Inspectors -2').exists():
        return redirect('inspector:inspector_page')   # 👈 или нужный тебе роут инспектора
    elif user.is_superuser or user.is_staff:
        return redirect('admin:index')
    else:
        return redirect('leadspec:supervisor_page')   # 👈 и тут
