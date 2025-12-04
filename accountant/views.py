from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from app_direction.decorators import accountant_required
from slujba.models import ClosedViolation, Service


@login_required
@accountant_required
def accountant_list(request):

    return render(request, "accountant/acc_list.html")


@login_required
@accountant_required
@require_GET
def accountant_api_list(request):
    """Возвращает список нарушений для панели бухгалтера."""

    qs = (
        ClosedViolation.objects.all()
        .prefetch_related("services")
        .order_by("-date", "-id")
    )

    date_from = request.GET.get("date_from") or ""
    date_to = request.GET.get("date_to") or ""
    airport = request.GET.get("airport") or ""
    service = request.GET.get("service") or ""
    offender = request.GET.get("offender") or ""

    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    if airport:
        qs = qs.filter(airport=airport)
    if service:
        qs = qs.filter(services__code=service)
    if offender:
        qs = qs.filter(offender__icontains=offender)

    qs = qs.distinct()

    items = []
    for violation in qs:
        services_codes = list(
            violation.services.values_list("code", flat=True)
        )
        items.append(
            {
                "id": violation.id,
                "date": violation.date.isoformat() if violation.date else "",
                "airport": violation.airport,
                "service": ", ".join(services_codes),
                "offender": violation.offender,
                "measures": violation.measures,
            }
        )

    airports_choices = list(
        ClosedViolation.objects.exclude(airport="")
        .values_list("airport", flat=True)
        .distinct()
        .order_by("airport")
    )

    services_choices = list(
        Service.objects.filter(closed_violations__isnull=False)
        .values_list("code", flat=True)
        .distinct()
        .order_by("code")
    )

    return JsonResponse(
        {

            "items": items,
            "choices": {
                "airports": airports_choices,
                "services": services_choices,
            },
        }

    )

