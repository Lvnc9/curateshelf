from django.urls import path

from .views import MarkNotificationsReadView, NotificationListView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    path("notifications/read/", MarkNotificationsReadView.as_view(), name="notifications-read"),
]