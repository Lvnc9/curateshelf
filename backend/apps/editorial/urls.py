from django.urls import path

from .views import CollectionDetailView, CollectionListView

urlpatterns = [
    path("shelves/", CollectionListView.as_view(), name="shelf-list"),
    path("shelves/<slug:slug>/", CollectionDetailView.as_view(), name="shelf-detail"),
]