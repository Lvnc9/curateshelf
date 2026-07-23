from celery import shared_task
from django.db.models import Count, Q


@shared_task
def recompute_attitude_stats():
    from apps.catalog.models import Product
    from apps.users.models import Profile

    from .models import Attitude

    for product in Product.objects.all().iterator():
        counts = (
            Attitude.objects.filter(product=product)
            .values("kind")
            .annotate(c=Count("id"))
        )
        data = {row["kind"]: row["c"] for row in counts}
        Product.objects.filter(pk=product.pk).update(
            love_count=data.get(Attitude.Kind.LOVE, 0),
            curious_count=data.get(Attitude.Kind.CURIOUS, 0),
            skip_count=data.get(Attitude.Kind.SKIP, 0),
            editorial_score=(
                data.get(Attitude.Kind.LOVE, 0) * 3
                + data.get(Attitude.Kind.CURIOUS, 0) * 1.5
                - data.get(Attitude.Kind.SKIP, 0) * 0.5
            ),
        )

    for profile in Profile.objects.all().iterator():
        counts = (
            Attitude.objects.filter(user=profile.user)
            .values("kind")
            .annotate(c=Count("id"))
        )
        data = {row["kind"]: row["c"] for row in counts}
        Profile.objects.filter(pk=profile.pk).update(
            loves_given=data.get(Attitude.Kind.LOVE, 0),
            curious_given=data.get(Attitude.Kind.CURIOUS, 0),
            skips_given=data.get(Attitude.Kind.SKIP, 0),
        )
    return "ok"


@shared_task
def flag_spam_comment(comment_id: int):
    from .models import Comment

    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return
    body = comment.body.lower()
    spam_signals = ["http://", "https://", "buy now", "crypto", "viagra"]
    if any(s in body for s in spam_signals) or len(comment.body) > 2000:
        comment.is_flagged = True
        comment.save(update_fields=["is_flagged"])