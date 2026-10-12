from rest_framework import generics, permissions

from .models import Collection
from .serializers import CollectionDetailSerializer, CollectionListSerializer


class CollectionListView(generics.ListAPIView):
    serializer_class = CollectionListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Collection.objects.all()
        if self.request.query_params.get("featured") == "1":
            qs = qs.filter(is_featured=True)
        return qs


class CollectionDetailView(generics.RetrieveAPIView):
    serializer_class = CollectionDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Collection.objects.prefetch_related(
        "items__product__category", "items__product__tags", "items__product__media"
    )