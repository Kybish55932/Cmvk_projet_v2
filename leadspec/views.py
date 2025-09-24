from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
from inspector.models import Inspector   # используем модель из приложения inspector

# 📌 API список
def api_list(request):
    items = [
        {
            "id": v.id,
            "date": v.date.isoformat() if v.date else "",
            "airport": v.airport,
            "flight": v.flight,
            "direction": v.direction,
            "type": v.type,
            "time_start": v.time_start.isoformat() if v.time_start else "",
            "time_end": v.time_end.isoformat() if v.time_end else "",
            "sector": v.sector,
            "violation_start": v.violation_start.isoformat() if v.violation_start else "",
            "violation_end": v.violation_end.isoformat() if v.violation_end else "",
            "service": v.service,
            "violation": v.violation,
            "description": v.description,
            "supervisor": v.supervisor,
            "tehnick": v.inspector,  # сохраняем совместимость
            "status": v.status,
        }
        for v in Inspector.objects.filter(source="supervisor").order_by("-id")
    ]
    return JsonResponse({"items": items})


# 📌 API создание
@csrf_exempt
def api_create(request):
    data = json.loads(request.body.decode("utf-8"))
    v = Inspector.objects.create(
        date=data.get("date") or None,
        airport=data.get("airport", ""),
        flight=data.get("flight", ""),
        direction=data.get("direction", ""),
        type=data.get("type", ""),
        time_start=data.get("time_start") or None,
        time_end=data.get("time_end") or None,
        sector=data.get("sector", ""),
        violation_start=data.get("violation_start") or None,
        violation_end=data.get("violation_end") or None,
        service=data.get("service", ""),
        violation=data.get("violation", ""),
        description=data.get("description", ""),
        supervisor=data.get("supervisor", ""),
        inspector=data.get("tehnick", ""),  # поле inspector
        shift=data.get("shift", ""),
        status=data.get("status", "new"),
        source="supervisor",
    )
    return JsonResponse({"success": True, "id": v.id})


# 📌 API обновление
@csrf_exempt
def api_update(request, id):
    try:
        v = Inspector.objects.get(id=id, source="supervisor")
    except Inspector.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    data = json.loads(request.body.decode("utf-8"))
    for field in [
        "date", "airport", "flight", "direction", "type",
        "time_start", "time_end", "sector",
        "violation_start", "violation_end",
        "service", "violation", "description",
        "supervisor", "inspector", "shift", "status"
    ]:
        if field in data:
            setattr(v, field, data[field] or None)

    v.save()
    return JsonResponse({"success": True})


# 📌 API удаление
@csrf_exempt
def api_delete(request, id):
    try:
        v = Inspector.objects.get(id=id, source="supervisor")
        v.delete()
        return JsonResponse({"success": True})
    except Inspector.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


# 📌 Страница панели supervisor
def supervisor_page(request):
    return render(request, "supervisor/supervisor_list.html")

def leadspec_list(request):
    """Главная страница для старшей смены (supervisor)."""
    violations = Inspector.objects.all()
    return render(request, "supervisor/supervisor_list.html", {
        "violations": violations
    })