from unfold.admin import ModelAdmin

from django.contrib import admin

from .models import Attitude, Bookmark, Comment, CommentLike


@admin.register(Attitude)
class AttitudeAdmin(ModelAdmin):
    list_display = ("user", "product", "kind", "updated_at")
    list_filter = ("kind",)
    search_fields = ("user__email", "product__title")


@admin.register(Comment)
class CommentAdmin(ModelAdmin):
    list_display = ("id", "product", "author", "is_hidden", "is_flagged", "likes_count", "created_at")
    list_filter = ("is_hidden", "is_flagged")
    search_fields = ("body", "author__email", "product__title")
    actions = ["hide_comments", "unhide_comments"]

    @admin.action(description="Hide selected")
    def hide_comments(self, request, queryset):
        queryset.update(is_hidden=True)

    @admin.action(description="Unhide selected")
    def unhide_comments(self, request, queryset):
        queryset.update(is_hidden=False, is_flagged=False)


@admin.register(CommentLike)
class CommentLikeAdmin(ModelAdmin):
    list_display = ("comment", "user", "created_at")


@admin.register(Bookmark)
class BookmarkAdmin(ModelAdmin):
    list_display = ("user", "product", "created_at")