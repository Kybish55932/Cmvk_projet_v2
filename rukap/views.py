# rukap/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta
import json

from inspector.models import Inspector
from django.contrib.auth.decorators import login_required, user_passes_test

def is_rukap(user):
    return user.groups.filter(name="rukap").exists() or user.is_superuser

@login_required
@user_passes_test(is_rukap)
def rukap_list(request): ...
@login_required
@user_passes_test(is_rukap)
def api_week(request): ...
@login_required
@user_passes_test(is_rukap)
@csrf_exempt
def agreed_violations(request): ...
@login_required
@user_passes_test(is_rukap)
def approve_violation(request, id):
    v = Inspector.objects.get(id=id)
    if v.status != "sent":
        return JsonResponse({"error": "Можно согласовать только статус 'sent'."}, status=400)
    v.status = "agreed"
    v.save()
    return JsonResponse({"success": True})

def _week_range(offset: int = -1):
    """
    Возвращает (monday, sunday) для недели со смещением:
    0 — текущая неделя, -1 — прошлая и т.д.
    """
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday()) + timedelta(days=offset * 7)
    sunday = monday + timedelta(days=6)
    return monday, sunday


def rukap_list(request):
    """
    Страница Рукапа. Саму таблицу наполняем через JS (API ниже).
    По умолчанию покажем ПРОШЛУЮ неделю (offset=-1) в заголовке.
    """
    monday, sunday = _week_range(-1)
    return render(request, "rukap/rukap_list.html", {
        "default_week_from": monday,
        "default_week_to": sunday,
    })


def api_week(request):
    """
    GET /rukap/api/?week_offset=-1
    Возвращает нарушения со статусом 'sent' за указанную неделю.
    """
    try:
        offset = int(request.GET.get("week_offset", -1))
    except ValueError:
        offset = -1

    monday, sunday = _week_range(offset)
    qs = (
        Inspector.objects
        .filter(status="sent", date__range=(monday, sunday))
        .order_by("date", "id")
    )

    items = []
    for v in qs:
        items.append({
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
            "services": list(v.services.values_list("code", flat=True)),
            "violation": v.violation,
            "description": v.description,
            "status": v.status,
        })

    return JsonResponse({
        "items": items,
        "from": monday.isoformat(),
        "to": sunday.isoformat(),
        "offset": offset,
    })


@csrf_exempt  # если хочешь включить CSRF — сними декоратор и отправляй токен из JS
def agreed_violations(request):
    """
    POST /rukap/agreed/
    body: {"ids": [1,2,3]}
    Меняет статус выбранных нарушений 'sent' -> 'agreed'
    """
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
        ids = data.get("ids", [])
        if not isinstance(ids, list):
            return JsonResponse({"success": False, "error": "ids must be a list"}, status=400)

        updated = (
            Inspector.objects
            .filter(id__in=ids, status="sent")
            .update(status="agreed")
        )
        return JsonResponse({"success": True, "updated": updated})

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=400)

def approve_violation(request, id):
    """Подтверждение нарушения в рукап (финальный этап)."""
    try:
        v = Inspector.objects.get(id=id)
        v.status = "agreed"
        v.save()
        return JsonResponse({"success": True})
    except Inspector.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


qs = Inspector.objects.filter(status__in=["sent", "agreed"]).order_by("-date")