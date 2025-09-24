from django.shortcuts import render
from .models import Inspector

def inspector_page(request):
    violations = Inspector.objects.all()
    return render(request, "inspector/inspector.html", {"violations": violations})