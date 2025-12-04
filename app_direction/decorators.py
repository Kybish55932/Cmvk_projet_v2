from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import user_passes_test

def group_required(group_names):
    """Ограничивает доступ только определённым группам"""
    def in_groups(user):
        if user.is_authenticated:
            if user.groups.filter(name__in=group_names).exists() or user.is_superuser:
                return True
        return False
    return user_passes_test(in_groups, login_url="/users/login/")


# ✅ Для инспекторов
inspector_required = group_required(["inspector", ])

# ✅ Для старшей смены
supervisor_required = group_required(["supervisor", ])

# ✅ Для бухгалтеров
accountant_required = group_required(["accountant", ])