from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductFeedView,
    ProductListView,
    StaffProductViewSet,
    TagListView,
)

router = DefaultRouter()
router.register(r"staff/products", StaffProductViewSet, basename="staff-products")

urlpatterns = [
    path("products/feed/", ProductFeedView.as_view(), name="product-feed"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("tags/", TagListView.as_view(), name="tags"),
    path("", include(router.urls)),
]