from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, user_passes_test
import json
from inspector.models import Inspector
from inspector.signals import _to_codes
from slujba.models import Service


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
            "services": list(v.services.values_list("code", flat=True)),
            "violation": v.violation,
            "description": v.description,
            "supervisor": v.supervisor,
            "tehnick": v.inspector,
            "shift": v.shift or "",# для совместимости
            "status": v.status,
        }
        for v in Inspector.objects.filter(source="supervisor", user=request.user).order_by("-id")
    ]
    return JsonResponse({"items": items})


# 📌 API создание
@csrf_exempt
def api_create(request):
    data = json.loads(request.body.decode("utf-8"))
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    full_name = f"{request.user.last_name} {request.user.first_name}".strip() or request.user.username

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
        violation=data.get("violation", ""),
        description=data.get("description", ""),
        supervisor=full_name,   # автозаполнение
        user=request.user,      # связь с пользователем
        inspector=data.get("tehnick", ""),
        shift=data.get("shift", ""),
        status=data.get("status", "new"),
        source="supervisor",
    )
    codes = _to_codes(data.get("service"))
    if codes:
        v.services.set(Service.objects.filter(code__in=codes))

    return JsonResponse({"success": True, "id": v.id})


# 📌 API обновление
@csrf_exempt
def api_update(request, id):
    try:
        v = Inspector.objects.get(id=id, source="supervisor", user=request.user)
    except Inspector.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    editable_fields = [
        "date", "airport", "flight", "direction", "type",
        "time_start", "time_end", "sector",
        "violation_start", "violation_end",
        "violation", "description",
        "supervisor", "inspector", "shift", "status"
    ]

    for field in editable_fields:
        if field in data:
            setattr(v, field, data[field] or None)

    # ✅ Дополнительно обработаем tehnick, если он пришёл с фронта
    if "tehnick" in data:
        v.inspector = data.get("tehnick") or ""

    v.save()
    if "service" in data:
        codes = _to_codes(data.get("service"))
        if codes:
            v.services.set(Service.objects.filter(code__in=codes))
        else:
            v.services.clear()
    return JsonResponse({"success": True})

# 📌 API удаление
@csrf_exempt
def api_delete(request, id):
    try:
        v = Inspector.objects.get(id=id, source="supervisor", user=request.user)
        v.delete()
        return JsonResponse({"success": True})
    except Inspector.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


# 📌 WEB: доступ только для supervisor
def is_supervisor(user):
    return user.groups.filter(name="supervisor").exists()


@login_required
@user_passes_test(is_supervisor)
def supervisor_page(request):
    violations = Inspector.objects.filter(
        source="supervisor",
        user=request.user  # ✅ только записи текущего пользователя
    ).order_by("-id")
    return render(request, "supervisor/leadspec_list.html", {"violations": violations})
