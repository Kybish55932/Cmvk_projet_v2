from django.shortcuts import render

def service_list(request):
    # Тестовые нарушения
    violations = [
        {
            "date": "2025-09-15",
            "airport": "Манас",
            "flight": "SU1880",
            "direction": "Москва",
            "type": "Вылет",
            "time": "12:40",
            "sector": "L3",
            "violation_time": "12:10",
            "service": "САБ",
            "violation": "Без пропуска",
            "description": "Пассажир пытался пройти без документа",
            "supervisor": "Сырдыбаев А.Дж.",
            "tehnick": "Осмонов Нурсултан",
        },
        {
            "date": "2025-09-14",
            "airport": "Ош",
            "flight": "HY777",
            "direction": "Ташкент",
            "type": "Прилет",
            "time": "18:20",
            "sector": "L5",
            "violation_time": "18:05",
            "service": "СПОиАТ",
            "violation": "Опоздание",
            "description": "Экипаж задержался при посадке",
            "supervisor": "Сырдыбаев А. Дж.",
            "tehnick": "Касымова Рима",
        }
    ]

    return render(request, "service/service_list.html", {"violations": violations})
