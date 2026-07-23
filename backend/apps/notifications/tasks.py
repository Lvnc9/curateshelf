from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_comment_reply_notification(comment_id: int):
    from apps.engagement.models import Comment

    from .models import Notification

    try:
        comment = Comment.objects.select_related("parent__author", "author", "product").get(pk=comment_id)
    except Comment.DoesNotExist:
        return

    if not comment.parent_id:
        return

    parent_author = comment.parent.author
    if parent_author_id := parent_author.id:
        if parent_author_id == comment.author_id:
            return

    Notification.objects.create(
        user=parent_author,
        type=Notification.Type.COMMENT_REPLY,
        payload={
            "comment_id": comment.pk,
            "product_slug": comment.product.slug,
            "product_title": comment.product.title,
            "from_username": getattr(getattr(comment.author, "profile", None), "username", ""),
            "body_preview": comment.body[:120],
        },
    )

    profile = getattr(parent_author, "profile", None)
    if profile and profile.notify_replies and parent_author.email:
        send_mail(
            subject=f"New reply on {comment.product.title}",
            message=f"{comment.body}\n\nView: {settings.FRONTEND_URL}/p/{comment.product.slug}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[parent_author.email],
            fail_silently=True,
        )


@shared_task
def weekly_editorial_digest():
    from apps.catalog.models import Product
    from apps.users.models import Profile

    from .models import Notification

    products = list(
        Product.objects.filter(status=Product.Status.PUBLISHED).order_by("-editorial_score")[:5]
    )
    payload = {
        "products": [{"slug": p.slug, "title": p.title} for p in products],
    }
    for profile in Profile.objects.filter(notify_digest=True).select_related("user"):
        Notification.objects.create(
            user=profile.user,
            type=Notification.Type.DIGEST,
            payload=payload,
        )
        if profile.user.email and products:
            lines = "\n".join(f"- {p.title}" for p in products)
            send_mail(
                subject="CurateShelf weekly digest",
                message=f"This week's editorial picks:\n\n{lines}\n\n{settings.FRONTEND_URL}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[profile.user.email],
                fail_silently=True,
            )
    return len(products)