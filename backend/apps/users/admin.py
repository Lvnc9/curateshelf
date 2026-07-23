from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin

from .models import Profile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    ordering = ("email",)
    list_display = ("email", "is_staff", "is_active", "date_joined")
    search_fields = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "is_staff", "is_superuser")}),
    )
    filter_horizontal = ("groups", "user_permissions")


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ("username", "display_name", "role", "user", "created_at")
    search_fields = ("username", "display_name", "user__email")
    list_filter = ("role",)