from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

STATUS_CHOICES = [
    ("", "Не задано"),
    ("new", "Новая"),
    ("approved", "Подтверждена"),
    ("rejected", "Отклонена"),
    ("agreed", "Согласовано"),
]

SOURCE_CHOICES = [
    ("supervisor", "Старшая смена"),
    ("inspector", "Инспектор"),
]

class Inspector (models.Model):
    date = models.DateField(null=True, blank=True)
    airport = models.CharField(max_length=100, blank=True)
    flight = models.CharField(max_length=50, blank=True)
    direction = models.CharField(max_length=50, blank=True)
    type = models.CharField(max_length=50, blank=True)
    time_start = models.TimeField(null=True, blank=True)
    time_end = models.TimeField(null=True, blank=True)
    sector = models.CharField(max_length=50, blank=True)
    violation_start = models.TimeField(null=True, blank=True)
    violation_end = models.TimeField(null=True, blank=True)
    services = models.ManyToManyField("slujba.Service", related_name="inspector_items", blank=True)
    violation = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    supervisor = models.CharField(max_length=100, blank=True)
    inspector = models.CharField(max_length=100, blank=True)
    shift = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=50, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True, default="new")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, blank=True, default="supervisor")


    # служебные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # удобно видеть дату, аэропорт и статус
        return f"{self.date or ''} {self.airport} [{self.status or '—'}]"

