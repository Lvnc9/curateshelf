from django.urls import path

from .views import (
    CommentLikeView,
    MyAttitudesView,
    ProductAttitudeView,
    ProductCommentListCreateView,
    StaffCommentModerateView,
)

urlpatterns = [
    path("products/<slug:slug>/attitude/", ProductAttitudeView.as_view(), name="product-attitude"),
    path("products/<slug:slug>/comments/", ProductCommentListCreateView.as_view(), name="product-comments"),
    path("comments/<int:pk>/like/", CommentLikeView.as_view(), name="comment-like"),
    path("staff/comments/<int:pk>/moderate/", StaffCommentModerateView.as_view(), name="comment-moderate"),
    path("me/attitudes/", MyAttitudesView.as_view(), name="my-attitudes"),
]