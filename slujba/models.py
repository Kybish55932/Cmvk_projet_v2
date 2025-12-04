from django.db import models
from django.conf import settings

class ServiceViolation(models.Model):

    date = models.DateField(null=True, blank=True)
    airport = models.CharField(max_length=100, blank=True)
    flight = models.CharField(max_length=100, blank=True)
    direction = models.CharField(max_length=100, blank=True)
    type = models.CharField(max_length=100, blank=True)
    time_start = models.TimeField(null=True, blank=True)
    time_end = models.TimeField(null=True, blank=True)
    sector = models.CharField(max_length=100, blank=True)
    violation_start = models.TimeField(null=True, blank=True)
    violation_end = models.TimeField(null=True, blank=True)
    services = models.ManyToManyField("slujba.Service", related_name="service_violations", blank=True)
    violation = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    offender = models.CharField(max_length=150, blank=True)
    measures = models.CharField(max_length=150, blank=True)
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=50, default="agreed")

    class Meta:
        db_table = "service_violation"
        verbose_name = "Нарушение (начальник службы)"
        verbose_name_plural = "Нарушения (начальники служб)"

    def __str__(self):
        return f"{self.date} — {self.service} — {self.violation}"


class ClosedViolation(models.Model):
    """Отдельная таблица для хранения завершённых (закрытых) нарушений"""

    # 🔗 связь с исходной записью из Inspector
    inspector = models.ForeignKey(
        "inspector.Inspector",  # ссылается на твою модель Inspector
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_violations"
    )

    original_id = models.IntegerField(null=True, blank=True)  # id из основной таблицы
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
    services = models.ManyToManyField("slujba.Service", related_name="closed_violations", blank=True)
    violation = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    offender = models.CharField(max_length=200, blank=True)
    measures = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    closed_at = models.DateTimeField(auto_now_add=True)  # время переноса

    def __str__(self):
        return f"Закрытое нарушение №{self.original_id or self.id}"

class Service(models.Model):
    code = models.CharField(max_length=50, unique=True)   # "МСЧ", "АХО" и т.п.
    name = models.CharField(max_length=150, blank=True)   # Полное имя (необяз.)

    class Meta:
        verbose_name = "Служба"
        verbose_name_plural = "Службы"

    def __str__(self):
        return self.code


class ServiceHead(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_head")
    services = models.ManyToManyField("slujba.Service", related_name="heads", blank=True)

    class Meta:
        verbose_name = "Начальник службы"
        verbose_name_plural = "Начальники служб"

    def __str__(self):
        return f"{self.user} → {', '.join(s.code for s in self.services.all())}"