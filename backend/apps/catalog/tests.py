from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Product, ProductMedia


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class SeedImageryTests(TestCase):
    """seed_demo should ship a photo-led magazine, not gradient placeholders."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=open("/dev/null", "w"))

    def test_every_product_has_cover_and_gallery(self):
        for product in Product.objects.all():
            self.assertTrue(product.cover_image, product.slug)
            self.assertEqual(product.media.count(), 3, product.slug)
            self.assertTrue(all(m.alt_text for m in product.media.all()), product.slug)

    def test_seed_is_idempotent(self):
        before = ProductMedia.objects.count()
        call_command("seed_demo", stdout=open("/dev/null", "w"))
        self.assertEqual(ProductMedia.objects.count(), before)

    def test_feed_exposes_gallery_preview(self):
        res = APIClient().get("/api/products/feed/")
        self.assertEqual(res.status_code, 200)
        first = res.json()[0]
        self.assertTrue(first["cover_image"])
        self.assertEqual(len(first["gallery_preview"]), 2)
        self.assertTrue(first["gallery_preview"][0]["url"].startswith("http"))
        self.assertTrue(first["gallery_preview"][0]["alt"])

    def test_feed_query_count_is_flat(self):
        # 1 products + 1 tags + 1 media prefetch (category is a join)
        with self.assertNumQueries(3):
            APIClient().get("/api/products/feed/")
