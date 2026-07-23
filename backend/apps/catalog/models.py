from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    subtitle = models.CharField(max_length=300, blank=True, help_text="Short editorial deck")
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    inventory_count = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="products"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")
    brand = models.CharField(max_length=120, blank=True)
    maker_name = models.CharField(max_length=120, blank=True)
    cover_image = models.ImageField(upload_to="products/covers/", blank=True, null=True)
    editorial_score = models.FloatField(default=0)
    reading_time_estimate = models.PositiveSmallIntegerField(default=2, help_text="Minutes")
    published_at = models.DateTimeField(null=True, blank=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
    )
    love_count = models.PositiveIntegerField(default=0)
    curious_count = models.PositiveIntegerField(default=0)
    skip_count = models.PositiveIntegerField(default=0)
    search_vector = SearchVectorField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-editorial_score", "-published_at"]
        indexes = [
            GinIndex(fields=["search_vector"]),
            models.Index(fields=["status", "-published_at"]),
            models.Index(fields=["-editorial_score", "-published_at"]),
        ]

    def __str__(self):
        return self.title

    def publish(self):
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.scheduled_for = None
        self.save(update_fields=["status", "published_at", "scheduled_for", "updated_at"])


class ProductMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to="products/gallery/")
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    variants = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product_id} media {self.pk}"


class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attributes")
    key = models.CharField(max_length=80)
    value = models.CharField(max_length=255)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.key}: {self.value}"