from celery import shared_task
from django.contrib.postgres.search import SearchVector
from django.utils import timezone
from PIL import Image


@shared_task
def process_product_media(media_id: int):
    from .models import ProductMedia

    try:
        media = ProductMedia.objects.get(pk=media_id)
    except ProductMedia.DoesNotExist:
        return

    if media.media_type != ProductMedia.MediaType.IMAGE or not media.file:
        return

    path = media.file.path
    variants = {}
    sizes = {"thumb": (200, 200), "card": (800, 1000), "hero": (1600, 2000)}

    with Image.open(path) as img:
        img = img.convert("RGB")
        for name, size in sizes.items():
            clone = img.copy()
            clone.thumbnail(size)
            out_name = f"{path.rsplit('.', 1)[0]}_{name}.webp"
            clone.save(out_name, format="WEBP", quality=82)
            # store relative path under media root
            rel = out_name.split("/media/")[-1] if "/media/" in out_name else out_name
            variants[name] = f"/media/{rel}" if not rel.startswith("/") else rel

    media.variants = variants
    media.save(update_fields=["variants"])


@shared_task
def process_cover_image(product_id: int):
    from .models import Product

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return
    if not product.cover_image:
        return
    path = product.cover_image.path
    with Image.open(path) as img:
        img = img.convert("RGB")
        img.thumbnail((1600, 2000))
        img.save(path, format="JPEG", quality=88)


@shared_task
def publish_scheduled_products():
    from .models import Product

    now = timezone.now()
    qs = Product.objects.filter(status=Product.Status.SCHEDULED, scheduled_for__lte=now)
    count = 0
    for product in qs:
        product.publish()
        count += 1
    return count


@shared_task
def rebuild_search_vectors(product_id: int | None = None):
    from .models import Product

    qs = Product.objects.all()
    if product_id:
        qs = qs.filter(pk=product_id)
    for product in qs.iterator():
        Product.objects.filter(pk=product.pk).update(
            search_vector=SearchVector("title", weight="A")
            + SearchVector("subtitle", weight="B")
            + SearchVector("description", weight="C")
            + SearchVector("brand", weight="B")
            + SearchVector("maker_name", weight="B")
        )