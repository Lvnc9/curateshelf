from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        COMMENT_REPLY = "comment_reply", "Comment reply"
        PRODUCT_PUBLISHED = "product_published", "Product published"
        DIGEST = "digest", "Digest"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=40, choices=Type.choices)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} → {self.user_id}"