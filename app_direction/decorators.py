from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import user_passes_test

def group_required(group_names):
    def in_groups(user):
        if user.is_authenticated:
            if user.groups.filter(name__in=group_names).exists() or user.is_superuser:
                return True
        return False
    return user_passes_test(in_groups)

# Конкретные декораторы для групп
senior_shift_required = group_required(['Senior shift'])
inspectors_required = group_required(['Inspectors -1', 'Inspectors -2'])