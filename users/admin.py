from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_groups')
    list_filter = ('is_staff', 'is_superuser', 'groups')

    # Добавляем поле groups в fieldsets для редактирования в админке
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('department',)}),
    )

    def get_groups(self, obj):
        return ", ".join([group.name for group in obj.groups.all()])

    get_groups.short_description = 'Группы'

# Если нужно, можно также зарегистрировать стандартные модели
# from django.contrib.auth.models import Group
# admin.site.register(Group)
