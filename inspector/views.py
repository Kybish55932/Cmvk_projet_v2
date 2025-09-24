from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_GET
from datetime import time
import json

from .models import Inspector


AIRPORT_CHOICES = ["Манас", "Ош", "Баткен", "Разаков"]
TYPE_CHOICES = ["Прилет", "Вылет"]
SHIFT_CHOICES = ["1", "2", "3", "4"]


# ---------------- helpers ----------------
def _payload(request):
    """Принимаем либо JSON (fetch), либо form-data (форма)."""
    if request.content_type and "application/json" in request.content_type:
        try:
            return json.loads(request.body or b"{}")
        except Exception:
            return {}
    return request.POST.dict()


def _parse_hhmm(value):
    """'HH:MM' -> time(...) или None; пустые строки тоже -> None."""
    if not value:
        return None
    try:
        hh, mm = value.strip().split(":")
        return time(int(hh), int(mm))
    except Exception:
        return None


# ---------------- CRUD ----------------
@csrf_exempt
@require_http_methods(["POST"])
def add_violation(request):
    data = _payload(request)
    v = Inspector.objects.create(
        date=data.get("date"),
        airport=data.get("airport", ""),
        flight=data.get("flight", ""),
        direction=data.get("direction", ""),
        type=data.get("type", ""),
        time_start=_parse_hhmm(data.get("time_start")),
        time_end=_parse_hhmm(data.get("time_end")),
        sector=data.get("sector", ""),
        violation_start=_parse_hhmm(data.get("violation_start")),
        violation_end=_parse_hhmm(data.get("violation_end")),
        service=data.get("service", ""),
        violation=data.get("violation", ""),
        description=data.get("description", ""),
        supervisor=data.get("supervisor", ""),
        inspector=data.get("inspector", ""),
        shift=data.get("shift", ""),
        status=data.get("status", ""),
        source="inspector",
    )
    return JsonResponse({"id": v.id})


@csrf_exempt
@require_http_methods(["POST"])
def edit_violation(request, id):
    v = get_object_or_404(Inspector, id=id)
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # список всех разрешённых полей
    editable_fields = [
        "date", "airport", "flight", "direction", "type",
        "time_start", "time_end", "sector",
        "violation_start", "violation_end",
        "service", "violation", "description",
        "supervisor", "inspector", "shift", "status"
    ]

    for field in editable_fields:
        if field in data and data[field] not in (None, "", []):
            if field in ("time_start", "time_end", "violation_start", "violation_end"):
                setattr(v, field, _parse_hhmm(data[field]))
            else:
                setattr(v, field, data[field])

    v.save()
    return JsonResponse({"success": True})


@csrf_exempt
def delete_violation(request, id):
    if request.method == "POST":
        v = get_object_or_404(Inspector, id=id)
        v.delete()
        return JsonResponse({"success": True})
    return JsonResponse({"error": "Invalid request"}, status=400)


# ---------------- Lists ----------------
@require_GET
def choices(request):
    return JsonResponse({
        "airports": AIRPORT_CHOICES,
        "types": TYPE_CHOICES,
        "shifts": SHIFT_CHOICES,
    })


def inspector_list(request):
    """Возвращает JSON (для API)."""
    qs = Inspector.objects.all().order_by("-date", "-id")
    data = [
        {
            "id": v.id,
            "date": v.date.isoformat() if v.date else "",
            "airport": v.airport,
            "flight": v.flight,
            "direction": v.direction,
            "type": v.type,
            "time_start": v.time_start.isoformat(timespec="minutes") if v.time_start else "",
            "time_end": v.time_end.isoformat(timespec="minutes") if v.time_end else "",
            "sector": v.sector,
            "violation_start": v.violation_start.isoformat(timespec="minutes") if v.violation_start else "",
            "violation_end": v.violation_end.isoformat(timespec="minutes") if v.violation_end else "",
            "service": v.service,
            "violation": v.violation,
            "description": v.description,
            "supervisor": v.supervisor,
            "inspector": v.inspector,
            "shift": v.shift,
            "status": v.status,
        }
        for v in qs
    ]
    return JsonResponse(data, safe=False)


def inspector_page(request):
    qs = Inspector.objects.all()

    # фильтрация
    date_from = request.GET.get("dateFrom")
    date_to   = request.GET.get("dateTo")
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)

    airport = request.GET.get("airport")
    if airport:
        qs = qs.filter(airport=airport)

    service = request.GET.get("service")
    if service:
        qs = qs.filter(service=service)

    inspector = request.GET.get("inspector")
    if inspector:
        qs = qs.filter(inspector=inspector)

    shift = request.GET.get("shiftFilter")
    if shift:
        qs = qs.filter(shift=shift)

    return render(request, "inspector/inspector_list.html", {"violations": qs})


def database_page(request):
    violations = Inspector.objects.all().order_by("-date", "-id")
    return render(request, "inspector/database.html", {"violations": violations})
