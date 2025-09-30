from django.shortcuts import render
from django.http import JsonResponse
from inspector.models import Inspector
from django.views.decorators.csrf import csrf_exempt
import json

def rukap_list(request):
    # Загружаем только нарушения со статусом "sent"
    violations = Inspector.objects.filter(status="sent").order_by("date")
    return render(request, "rukap/rukap_list.html", {"violations": violations})

@csrf_exempt
def agreed_violations(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            ids = data.get("ids", [])
            updated = Inspector.objects.filter(id__in=ids, status="sent").update(status="agreed")
            return JsonResponse({"success": True, "updated": updated})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Invalid request"}, status=400)
