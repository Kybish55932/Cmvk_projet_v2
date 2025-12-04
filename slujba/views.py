from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Service  # + Service
from django.contrib.auth.decorators import login_required

import json
from inspector.models import Inspector
from .models import ServiceViolation, ClosedViolation

# Кому какие службы доступны
def _user_services_qs(user):
    if user.is_superuser:
        return Service.objects.all()
        # если используете ServiceHead (как советовал), то так:
    if hasattr(user, "service_head"):
        return user.service_head.services.all()
    return Service.objects.none()

def _find_or_create_sv_for_inspector(insp: Inspector) -> ServiceViolation:
    # Ищем БЕЗ поля service (его больше нет в нормальной модели)
    sv = (ServiceViolation.objects.filter(
            date=insp.date,
            airport=insp.airport,
            flight=insp.flight,
            direction=insp.direction,
            type=insp.type,
            time_start=insp.time_start,
            time_end=insp.time_end,
            sector=insp.sector,
            violation_start=insp.violation_start,
            violation_end=insp.violation_end,
            violation=insp.violation,
         ).order_by("-id").first())
    if not sv:
        sv = ServiceViolation.objects.create(
            date=insp.date,
            airport=insp.airport,
            flight=insp.flight,
            direction=insp.direction,
            type=insp.type,
            time_start=insp.time_start,
            time_end=insp.time_end,
            sector=insp.sector,
            violation_start=insp.violation_start,
            violation_end=insp.violation_end,
            violation=insp.violation,
            description=getattr(insp, "description", "") or "",
            status=getattr(insp, "status", "agreed") or "agreed",
        )
    # Синхронизируем службы 1:1
    sv.services.set(insp.services.all())
    return sv


@login_required
def slujba_list(request):
    user_services = _user_services_qs(request.user)

    insp_qs = (Inspector.objects
               .filter(status="agreed", services__in=user_services)
               .distinct()
               .order_by("-date", "-id"))

    rows = []
    for i in insp_qs:
        sv = _find_or_create_sv_for_inspector(i)
        service_str = ", ".join(s.code for s in i.services.all())
        rows.append({
            "id": i.id,
            "date": i.date,
            "airport": i.airport,
            "flight": i.flight,
            "direction": i.direction,
            "type": i.type,
            "time_start": i.time_start,
            "time_end": i.time_end,
            "sector": i.sector,
            "violation_start": i.violation_start,
            "violation_end": i.violation_end,
            "service": service_str,
            "violation": i.violation,
            "description": getattr(i, "description", ""),
            "offender": sv.offender or "",
            "measures": sv.measures or "",
            "comment": sv.comment or "",
        })

    return render(request, "slujba/slujba_list.html", {"violations": rows})
@csrf_exempt
@login_required
def update_violation(request, id):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    data = json.loads(request.body or "{}")
    insp = get_object_or_404(Inspector, id=id)

    # доступ: у пользователя должна быть хотя бы одна общая служба с записью
    user_services = set(_user_services_qs(request.user).values_list("id", flat=True))
    record_services = set(insp.services.values_list("id", flat=True))
    if not request.user.is_superuser and not (user_services & record_services):
        return JsonResponse({"error": "Forbidden"}, status=403)

    sv = _find_or_create_sv_for_inspector(insp)
    sv.offender = (data.get("offender") or "").strip()
    sv.measures = (data.get("measures") or "").strip()
    sv.comment = (data.get("comment") or "").strip()
    sv.save()

    action = (data.get("action") or "").lower()
    if action == "close":
        sv.status = "closed";
        sv.save(update_fields=["status"])
        insp.status = "closed";
        insp.save(update_fields=["status"])

        cv = ClosedViolation.objects.create(
            inspector=insp,
            original_id=insp.id,
            date=insp.date,
            airport=insp.airport,
            flight=insp.flight,
            direction=insp.direction,
            type=insp.type,
            time_start=insp.time_start,
            time_end=insp.time_end,
            sector=insp.sector,
            violation_start=insp.violation_start,
            violation_end=insp.violation_end,
            violation=insp.violation,
            description=getattr(insp, "description", ""),
            offender=sv.offender,
            measures=sv.measures,
            comment=sv.comment,
            # legacy поле service (CharField) оставляем пустым, если оно ещё не удалено
            # services="",
        )
        cv.services.set(insp.services.all())

    return JsonResponse({"success": True})