from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product

from .models import Attitude, Comment, CommentLike
from .serializers import (
    AttitudeWriteSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    MyAttitudeProductSerializer,
    apply_attitude,
    remove_attitude,
)


class ProductAttitudeView(APIView):
    def put(self, request, slug):
        product = get_object_or_404(Product, slug=slug, status=Product.Status.PUBLISHED)
        serializer = AttitudeWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attitude = apply_attitude(request.user, product, serializer.validated_data["kind"])
        product.refresh_from_db()
        return Response(
            {
                "kind": attitude.kind,
                "love_count": product.love_count,
                "curious_count": product.curious_count,
                "skip_count": product.skip_count,
            }
        )

    def delete(self, request, slug):
        product = get_object_or_404(Product, slug=slug)
        remove_attitude(request.user, product)
        product.refresh_from_db()
        return Response(
            {
                "kind": None,
                "love_count": product.love_count,
                "curious_count": product.curious_count,
                "skip_count": product.skip_count,
            }
        )


class MyAttitudesView(generics.ListAPIView):
    serializer_class = MyAttitudeProductSerializer

    def get_queryset(self):
        qs = (
            Attitude.objects.filter(user=self.request.user)
            .select_related("product", "product__category")
            .prefetch_related("product__tags")
            .order_by("-updated_at")
        )
        kind = self.request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        return qs


class ProductCommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_product(self):
        return get_object_or_404(Product, slug=self.kwargs["slug"], status=Product.Status.PUBLISHED)

    def get_queryset(self):
        sort = self.request.query_params.get("sort", "newest")
        qs = (
            Comment.objects.filter(product=self.get_product(), parent=None, is_hidden=False)
            .select_related("author__profile")
            .prefetch_related("replies__author__profile")
        )
        if sort == "top":
            return qs.order_by("-likes_count", "-created_at")
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["product"] = self.get_product()
        return ctx

    def perform_create(self, serializer):
        serializer.save()


class CommentLikeView(APIView):
    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk, is_hidden=False)
        like, created = CommentLike.objects.get_or_create(comment=comment, user=request.user)
        if created:
            Comment.objects.filter(pk=comment.pk).update(likes_count=comment.likes_count + 1)
            comment.refresh_from_db()
        return Response({"likes_count": comment.likes_count, "liked": True})

    def delete(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        deleted, _ = CommentLike.objects.filter(comment=comment, user=request.user).delete()
        if deleted:
            Comment.objects.filter(pk=comment.pk, likes_count__gt=0).update(
                likes_count=comment.likes_count - 1
            )
            comment.refresh_from_db()
        return Response({"likes_count": comment.likes_count, "liked": False})


class StaffCommentModerateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        action = request.data.get("action")
        if action == "hide":
            comment.is_hidden = True
        elif action == "unhide":
            comment.is_hidden = False
            comment.is_flagged = False
        else:
            return Response({"detail": "action must be hide or unhide"}, status=400)
        comment.save(update_fields=["is_hidden", "is_flagged"])
        return Response({"id": comment.pk, "is_hidden": comment.is_hidden})