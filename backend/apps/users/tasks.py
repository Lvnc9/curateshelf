from celery import shared_task
from django.conf import settings
from PIL import Image


@shared_task
def process_avatar(profile_id: int):
    from .models import Profile

    try:
        profile = Profile.objects.get(pk=profile_id)
    except Profile.DoesNotExist:
        return

    if not profile.avatar:
        return

    path = profile.avatar.path
    with Image.open(path) as img:
        img = img.convert("RGB")
        img.thumbnail((400, 400))
        img.save(path, format="JPEG", quality=85)