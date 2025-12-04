from django.apps import AppConfig


class ViolationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inspector'

# inspector/apps.py
from django.apps import AppConfig

class InspectorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "inspector"

    def ready(self):
        # импортируем сигналы при старте Django
        import inspector.signals  # noqa