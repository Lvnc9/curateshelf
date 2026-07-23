from django.db import connection
from django.http import JsonResponse
from django.urls import path
from django.core.cache import cache


def health(request):
    db_ok = True
    redis_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False
    try:
        cache.set("healthcheck", "1", 5)
        redis_ok = cache.get("healthcheck") == "1"
    except Exception:
        redis_ok = False
    status = 200 if db_ok and redis_ok else 503
    return JsonResponse({"status": "ok" if status == 200 else "degraded", "db": db_ok, "redis": redis_ok}, status=status)


urlpatterns = [
    path("", health, name="health"),
]