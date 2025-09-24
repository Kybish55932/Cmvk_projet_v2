from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    department = models.CharField(max_length=100, blank=True)

    def is_in_group(self, group_name):
        return self.groups.filter(name=group_name).exists()

    def get_group_name(self):
        if self.groups.exists():
            return self.groups.first().name
        return None

from django.db import models

# Create your models here.
