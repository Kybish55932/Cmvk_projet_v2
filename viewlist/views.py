# viewlist/views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from slujba.models import ClosedViolation, Service

@login_required
def all_violations_list(request):
    """
    Страница просмотра всего списка нарушений.
    Показываем все колонки, КРОМЕ: 'старший смены' (supervisor) и 'кем выявлено' (tehnick/inspector).
    Статус не показываем и не фильтруем.
    Фильтры: дата от/до, аэропорт (select), служба (multiselect), вид нарушения (multiselect), кто нарушил (text).
    """

    # В итоговом списке показываем только финально обработанные (закрытые) нарушения.
    qs = (
        ClosedViolation.objects
        .all()
        .prefetch_related("services")
        .order_by("-date", "-id")
    )

    # ---- Получаем значения фильтров из GET ----
    date_from = request.GET.get("dateFrom") or ""
    date_to   = request.GET.get("dateTo") or ""
    airports  = request.GET.getlist("airport")  # мультиселект
    services  = request.GET.getlist("service")  # мультиселект
    vtypes    = request.GET.getlist("violation")  # мультиселект
    offender  = request.GET.get("offender") or ""

    # ---- Применяем фильтры ----
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    if airports:
        qs = qs.filter(airport__in=airports)
    if services:
        qs = qs.filter(services__code__in=services)
    if vtypes:
        qs = qs.filter(violation__in=vtypes)
    if offender:
        qs = qs.filter(offender__icontains=offender)

    qs = qs.distinct()

    # ---- Справочники для выпадающих списков ----
    # Примечание: service/violation у тебя могут храниться строками,
    # здесь берём distinct по точным значениям.
    airports_choices = (
        ClosedViolation.objects.exclude(airport="")
        .values_list("airport", flat=True)
        .distinct()
        .order_by("airport")
    )
    services_choices = (
        Service.objects.filter(closed_violations__isnull=False)
        .values_list("code", flat=True)
        .distinct()
        .order_by("code")
    )
    violations_choices = (
        ClosedViolation.objects.exclude(violation="")
        .values_list("violation", flat=True)
        .distinct()
        .order_by("violation")
    )

    violations = []
    for v in qs:
        services_codes = list(v.services.values_list("code", flat=True))
        violations.append({
            "date": v.date,
            "airport": v.airport,
            "flight": v.flight,
            "direction": v.direction,
            "type": v.type,
            "time_start": v.time_start,
            "time_end": v.time_end,
            "sector": v.sector,
            "violation_start": v.violation_start,
            "violation_end": v.violation_end,
            "service": ", ".join(services_codes),
            "violation": v.violation,
            "description": v.description,
            "offender": v.offender,
            "measures": v.measures,
            "comment": v.comment,
        })

    context = {
        # данные таблицы
        "violations": violations,                 # данные таблицы
        "date_from": date_from,
        "date_to": date_to,
        "selected_airports": airports,
        "selected_services": services,
        "selected_violations": vtypes,
        "offender_query": offender,

        "airports_choices": airports_choices,
        "services_choices": services_choices,
        "violations_choices": violations_choices,
    }
    return render(request, "viewlist/list.html", context)
