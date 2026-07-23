import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("curateshelf")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "publish-scheduled-products": {
        "task": "apps.catalog.tasks.publish_scheduled_products",
        "schedule": 60.0,
    },
    "recompute-attitude-stats-nightly": {
        "task": "apps.engagement.tasks.recompute_attitude_stats",
        "schedule": crontab(hour=3, minute=0),
    },
    "weekly-editorial-digest": {
        "task": "apps.notifications.tasks.weekly_editorial_digest",
        "schedule": crontab(hour=9, minute=0, day_of_week=1),
    },
}