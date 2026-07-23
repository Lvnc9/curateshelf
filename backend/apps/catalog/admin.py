from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline

from .models import Category, Product, ProductAttribute, ProductMedia, Tag
from .tasks import process_product_media, rebuild_search_vectors


class ProductMediaInline(TabularInline):
    model = ProductMedia
    extra = 1


class ProductAttributeInline(TabularInline):
    model = ProductAttribute
    extra = 1


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ("name", "slug", "parent", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Tag)
class TagAdmin(ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.action(description="Publish now")
def publish_now(modeladmin, request, queryset):
    for product in queryset:
        product.publish()


@admin.action(description="Regenerate image variants")
def regenerate_variants(modeladmin, request, queryset):
    for product in queryset:
        for m in product.media.all():
            process_product_media.delay(m.pk)
        rebuild_search_vectors.delay(product.pk)


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = (
        "title",
        "status",
        "category",
        "price",
        "inventory_count",
        "editorial_score",
        "published_at",
        "love_count",
    )
    list_filter = ("status", "category", "currency")
    search_fields = ("title", "subtitle", "sku", "brand", "maker_name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProductMediaInline, ProductAttributeInline]
    actions = [publish_now, regenerate_variants]
    readonly_fields = ("love_count", "curious_count", "skip_count", "created_at", "updated_at")
    fieldsets = (
        ("Content", {"fields": ("title", "slug", "subtitle", "description", "cover_image")}),
        ("Taxonomy", {"fields": ("category", "tags", "brand", "maker_name")}),
        ("Pricing / Inventory", {"fields": ("price", "currency", "compare_at_price", "sku", "inventory_count")}),
        ("Editorial", {"fields": ("editorial_score", "reading_time_estimate", "status")}),
        ("Schedule", {"fields": ("published_at", "scheduled_for")}),
        ("Engagement", {"fields": ("love_count", "curious_count", "skip_count")}),
        ("Meta", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        if not obj.created_by_id:
            obj.created_by = request.user
        if obj.status == Product.Status.PUBLISHED and not obj.published_at:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)