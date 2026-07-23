from django.db import models

from apps.catalog.models import Product


class Collection(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True)
    cover = models.ImageField(upload_to="shelves/", blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    products = models.ManyToManyField(Product, through="CollectionItem", related_name="collections")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.title


class CollectionItem(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="collection_items")
    position = models.PositiveIntegerField(default=0)
    blurb = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["position", "id"]
        unique_together = ("collection", "product")

    def __str__(self):
        return f"{self.collection_id}:{self.product_id}"