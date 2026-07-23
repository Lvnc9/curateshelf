from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from apps.users.serializers import PublicProfileSerializer

from .models import Attitude, Bookmark, Comment, CommentLike
from .tasks import flag_spam_comment, recompute_attitude_stats

User = get_user_model()


class AttitudeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attitude
        fields = ("kind", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class AttitudeWriteSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=Attitude.Kind.choices)


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "body",
            "parent",
            "author",
            "likes_count",
            "liked_by_me",
            "replies",
            "created_at",
            "updated_at",
            "edited_at",
        )
        read_only_fields = ("likes_count", "created_at", "updated_at", "edited_at")

    def get_author(self, obj):
        profile = getattr(obj.author, "profile", None)
        if profile:
            return PublicProfileSerializer(profile, context=self.context).data
        return {"username": obj.author.email.split("@")[0]}

    def get_replies(self, obj):
        if obj.parent_id:
            return []
        replies = obj.replies.filter(is_hidden=False).select_related("author__profile")
        return CommentSerializer(replies, many=True, context=self.context).data

    def get_liked_by_me(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return CommentLike.objects.filter(comment=obj, user=request.user).exists()


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("body", "parent")

    def create(self, validated_data):
        request = self.context["request"]
        product = self.context["product"]
        comment = Comment.objects.create(
            author=request.user,
            product=product,
            **validated_data,
        )
        flag_spam_comment.delay(comment.pk)
        if comment.parent_id:
            from apps.notifications.tasks import send_comment_reply_notification

            send_comment_reply_notification.delay(comment.pk)
        return comment


class MyAttitudeProductSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Attitude
        fields = ("kind", "product", "created_at", "updated_at")


def apply_attitude(user, product: Product, kind: str) -> Attitude:
    with transaction.atomic():
        existing = Attitude.objects.select_for_update().filter(user=user, product=product).first()
        if existing:
            if existing.kind == kind:
                return existing
            _adjust_counts(product, existing.kind, -1)
            _adjust_profile(user, existing.kind, -1)
            existing.kind = kind
            existing.save(update_fields=["kind", "updated_at"])
            _adjust_counts(product, kind, 1)
            _adjust_profile(user, kind, 1)
            return existing
        attitude = Attitude.objects.create(user=user, product=product, kind=kind)
        _adjust_counts(product, kind, 1)
        _adjust_profile(user, kind, 1)
        return attitude


def remove_attitude(user, product: Product):
    with transaction.atomic():
        existing = Attitude.objects.select_for_update().filter(user=user, product=product).first()
        if not existing:
            return False
        _adjust_counts(product, existing.kind, -1)
        _adjust_profile(user, existing.kind, -1)
        existing.delete()
        return True


def _adjust_counts(product: Product, kind: str, delta: int):
    field = {
        Attitude.Kind.LOVE: "love_count",
        Attitude.Kind.CURIOUS: "curious_count",
        Attitude.Kind.SKIP: "skip_count",
    }[kind]
    Product.objects.filter(pk=product.pk).update(**{field: models_F(field) + delta})
    product.refresh_from_db(fields=[field])


def models_F(field):
    from django.db.models import F

    return F(field)


def _adjust_profile(user, kind: str, delta: int):
    from apps.users.models import Profile
    from django.db.models import F

    field = {
        Attitude.Kind.LOVE: "loves_given",
        Attitude.Kind.CURIOUS: "curious_given",
        Attitude.Kind.SKIP: "skips_given",
    }[kind]
    Profile.objects.filter(user=user).update(**{field: F(field) + delta})