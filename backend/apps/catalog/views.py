from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Prefetch
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.engagement.models import Attitude

from .models import Category, Product, Tag
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    TagSerializer,
)
from .tasks import process_product_media, rebuild_search_vectors


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug")
    tag = filters.CharFilter(field_name="tags__slug")
    status = filters.CharFilter()

    class Meta:
        model = Product
        fields = ["category", "tag", "status", "brand"]


class ProductFeedView(generics.ListAPIView):
    """Magazine scroll feed ordered by editorial score + published_at."""

    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = (
            Product.objects.filter(status=Product.Status.PUBLISHED)
            .select_related("category")
            .prefetch_related("tags")
            .order_by("-editorial_score", "-published_at")
        )
        user = self.request.user
        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch(
                    "attitudes",
                    queryset=Attitude.objects.filter(user=user),
                    to_attr="_prefetched_attitudes",
                )
            )
        return qs[:50]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    search_fields = ["title", "subtitle", "brand", "maker_name"]
    ordering_fields = ["published_at", "editorial_score", "price", "love_count"]

    def get_queryset(self):
        qs = (
            Product.objects.filter(status=Product.Status.PUBLISHED)
            .select_related("category")
            .prefetch_related("tags")
        )
        q = self.request.query_params.get("q") or self.request.query_params.get("search")
        if q:
            query = SearchQuery(q)
            qs = (
                qs.annotate(rank=SearchRank("search_vector", query))
                .filter(search_vector=query)
                .order_by("-rank", "-editorial_score")
            )
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        qs = Product.objects.select_related("category").prefetch_related(
            "tags", "media", "attributes"
        )
        if not self.request.user.is_staff:
            qs = qs.filter(status=Product.Status.PUBLISHED)
        return qs


class StaffProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related("category").prefetch_related("tags", "media", "attributes")
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action in ("list",):
            return ProductListSerializer
        if self.action in ("retrieve",):
            return ProductDetailSerializer
        return ProductWriteSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, slug=None):
        product = self.get_object()
        product.publish()
        return Response(ProductDetailSerializer(product, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def regenerate_media(self, request, slug=None):
        product = self.get_object()
        for m in product.media.all():
            process_product_media.delay(m.pk)
        rebuild_search_vectors.delay(product.pk)
        return Response({"status": "queued"})


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class HealthExtrasView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"products": Product.objects.filter(status=Product.Status.PUBLISHED).count()})