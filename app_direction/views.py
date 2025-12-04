from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

@login_required
def redirect_based_on_group(request):
    user = request.user
    if user.groups.filter(name="inspector").exists():
        return redirect("/inspector/inspector/")
    elif user.groups.filter(name="supervisor").exists():
        return redirect("/supervisor/")
    elif user.groups.filter(name="accountant").exists():
        return redirect("/accountant/")
    else:
        return redirect("/")  # например, главная страница