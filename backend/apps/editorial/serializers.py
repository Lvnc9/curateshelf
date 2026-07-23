from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer

from .models import Collection, CollectionItem


class CollectionItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = CollectionItem
        fields = ("position", "blurb", "product")


class CollectionListSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Collection
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "cover",
            "is_featured",
            "sort_order",
            "product_count",
        )


class CollectionDetailSerializer(CollectionListSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta(CollectionListSerializer.Meta):
        fields = CollectionListSerializer.Meta.fields + ("items", "created_at")