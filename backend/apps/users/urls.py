from django.urls import path

from .views import MeView, PublicAttitudesView, PublicProfileView, RegisterView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("users/<slug:username>/", PublicProfileView.as_view(), name="public-profile"),
    path("users/<slug:username>/attitudes/", PublicAttitudesView.as_view(), name="public-attitudes"),
]