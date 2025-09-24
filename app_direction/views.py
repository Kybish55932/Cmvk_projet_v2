from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required


@login_required
def redirect_based_on_group(request):
    user = request.user

    if user.is_in_group('Senior shift'):
        return redirect('leadspec:leadspec_list')
    elif user.is_in_group('Inspectors -1') or user.is_in_group('Inspectors -2'):
        return redirect('inspector:inspector_list')
    elif user.is_superuser or user.is_staff:
        return redirect('admin:index')
    else:
        return redirect('leadspec:leadspec_list')