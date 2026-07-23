from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Product, ProductMedia
from .tasks import process_cover_image, process_product_media, rebuild_search_vectors


@receiver(post_save, sender=Product)
def product_saved(sender, instance, **kwargs):
    try:
        rebuild_search_vectors.delay(instance.pk)
    except Exception:
        pass
    if instance.cover_image:
        try:
            process_cover_image.delay(instance.pk)
        except Exception:
            pass


@receiver(post_save, sender=ProductMedia)
def media_saved(sender, instance, created, **kwargs):
    if created or kwargs.get("update_fields") is None:
        try:
            process_product_media.delay(instance.pk)
        except Exception:
            pass