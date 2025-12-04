from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Service, ServiceViolation, ClosedViolation, ServiceHead

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")

@admin.register(ServiceHead)
class ServiceHeadAdmin(admin.ModelAdmin):
    list_display = ("user",)
    filter_horizontal = ("services",)

@admin.register(ServiceViolation)
class ServiceViolationAdmin(admin.ModelAdmin):
    list_display = ("date","airport","flight","status")
    filter_horizontal = ("services",)

@admin.register(ClosedViolation)
class ClosedViolationAdmin(admin.ModelAdmin):
    list_display = ("date","airport","flight")
    filter_horizontal = ("services",)

