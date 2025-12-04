from django.contrib import admin
from .models import Inspector

# 1) Попробуем снять старую регистрацию (если её не было — тихо проигнорируем)
try:
    admin.site.unregister(Inspector)
except admin.sites.NotRegistered:
    pass

# 2) Описываем свой класс админки
class InspectorAdmin(admin.ModelAdmin):
    # горизонтальный виджет для выбора нескольких служб в M2M-поле
    filter_horizontal = ("services",)

    # не обязательно, но удобно:
    list_display  = ("id", "date", "airport", "flight", "status")
    search_fields = ("flight", "airport", "violation", "description")
    list_filter   = ("status", "airport", "date")

# 3) Регистрируем заново с кастомным классом
admin.site.register(Inspector, InspectorAdmin)