from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Profile
from .tasks import process_avatar

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("email", "password", "username")

    def create(self, validated_data):
        username = validated_data.pop("username", "") or None
        user = User.objects.create_user(**validated_data)
        if username:
            profile = user.profile
            if not Profile.objects.filter(username=username).exclude(pk=profile.pk).exists():
                profile.username = username
                profile.save(update_fields=["username"])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "email",
            "display_name",
            "username",
            "bio",
            "avatar",
            "role",
            "location",
            "website",
            "loves_given",
            "curious_given",
            "skips_given",
            "notify_replies",
            "notify_digest",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "role",
            "loves_given",
            "curious_given",
            "skips_given",
            "created_at",
            "updated_at",
        )

    def update(self, instance, validated_data):
        avatar = validated_data.get("avatar")
        instance = super().update(instance, validated_data)
        if avatar is not None:
            process_avatar.delay(instance.pk)
        return instance


class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "display_name",
            "username",
            "bio",
            "avatar",
            "role",
            "location",
            "website",
            "loves_given",
            "curious_given",
            "created_at",
        )