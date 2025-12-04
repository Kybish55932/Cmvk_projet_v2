# inspector/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from slujba.models import Service
from .models import Inspector
import json, re

def _to_codes(val):
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    s = str(val or "").strip()
    if not s:
        return []
    try:
        v = json.loads(s.replace("'", '"'))
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
    except Exception:
        pass
    if s.startswith("[") and s.endswith("]"):
        inner = s[1:-1]
        parts = re.split(r"[,\s;]+", inner)
        return [p.strip(' "\'') for p in parts if p.strip(' "\'')]
    return [s.strip(' "\'')]

@receiver(post_save, sender=Inspector)
def fill_services_from_service_field(sender, instance: Inspector, created, **kwargs):
    # если M2M уже есть — не трогаем
    if instance.services.exists():
        return
    codes = _to_codes(getattr(instance, "service", ""))
    if not codes:
        return
    instance.services.set(Service.objects.filter(code__in=codes))
