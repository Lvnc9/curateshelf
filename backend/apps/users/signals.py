from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile, User


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        base = instance.email.split("@")[0].replace(".", "-").replace("_", "-")[:40] or "user"
        username = base
        n = 1
        while Profile.objects.filter(username=username).exists():
            username = f"{base}-{n}"
            n += 1
        Profile.objects.create(
            user=instance,
            username=username,
            display_name=base.replace("-", " ").title(),
        )