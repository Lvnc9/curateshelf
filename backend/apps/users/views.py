from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import ProfileSerializer, PublicProfileSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": ProfileSerializer(user.profile, context={"request": request}).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = PublicProfileSerializer
    lookup_field = "username"
    queryset = Profile.objects.select_related("user")
    permission_classes = [permissions.AllowAny]


class PublicAttitudesView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from apps.engagement.models import Attitude

        profile = get_object_or_404(Profile, username=self.kwargs["username"])
        qs = (
            Attitude.objects.filter(user=profile.user)
            .exclude(kind=Attitude.Kind.SKIP)
            .select_related("product", "product__category")
            .prefetch_related("product__tags")
            .order_by("-updated_at")
        )
        kind = self.request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        return qs

    def get_serializer_class(self):
        from apps.engagement.serializers import MyAttitudeProductSerializer

        return MyAttitudeProductSerializer