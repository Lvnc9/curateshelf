from unfold.admin import ModelAdmin, TabularInline
from django.contrib import admin

from .models import Collection, CollectionItem


class CollectionItemInline(TabularInline):
    model = CollectionItem
    extra = 1
    autocomplete_fields = ("product",)


@admin.register(Collection)
class CollectionAdmin(ModelAdmin):
    list_display = ("title", "slug", "is_featured", "sort_order")
    list_filter = ("is_featured",)
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "description")
    inlines = [CollectionItemInline]