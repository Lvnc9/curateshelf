from rest_framework import serializers

from .models import Category, Product, ProductAttribute, ProductMedia, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "sort_order")


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")


class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = ("id", "file", "media_type", "alt_text", "sort_order", "variants")


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ("id", "key", "value", "sort_order")


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    my_attitude = serializers.SerializerMethodField()
    gallery_preview = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "slug",
            "subtitle",
            "status",
            "price",
            "currency",
            "compare_at_price",
            "brand",
            "maker_name",
            "cover_image",
            "editorial_score",
            "reading_time_estimate",
            "published_at",
            "category",
            "tags",
            "love_count",
            "curious_count",
            "skip_count",
            "my_attitude",
            "inventory_count",
            "gallery_preview",
        )

    def get_gallery_preview(self, obj):
        """First two non-cover images (card-sized) for spreads and hover states in lists.

        Relies on `prefetch_related("media")` in list views to avoid N+1 queries.
        """
        request = self.context.get("request")
        items = []
        for media in obj.media.all():
            if media.media_type != ProductMedia.MediaType.IMAGE or media.sort_order == 0:
                continue  # sort_order 0 duplicates the cover image
            url = media.variants.get("card") or media.file.url
            items.append(
                {"url": request.build_absolute_uri(url) if request else url, "alt": media.alt_text}
            )
            if len(items) == 2:
                break
        return items

    def get_my_attitude(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        attitudes = getattr(obj, "_prefetched_attitudes", None)
        if attitudes is not None:
            for a in attitudes:
                if a.user_id == request.user.id:
                    return a.kind
        from apps.engagement.models import Attitude

        a = Attitude.objects.filter(user=request.user, product=obj).first()
        return a.kind if a else None


class ProductDetailSerializer(ProductListSerializer):
    media = ProductMediaSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    description = serializers.CharField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "description",
            "sku",
            "scheduled_for",
            "media",
            "attributes",
            "created_at",
            "updated_at",
        )


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "title",
            "slug",
            "subtitle",
            "description",
            "status",
            "price",
            "currency",
            "compare_at_price",
            "sku",
            "inventory_count",
            "category",
            "tags",
            "brand",
            "maker_name",
            "cover_image",
            "editorial_score",
            "reading_time_estimate",
            "published_at",
            "scheduled_for",
        )