from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.catalog.models import Category, Product, ProductAttribute, ProductMedia, Tag
from apps.editorial.models import Collection, CollectionItem
from apps.engagement.models import Attitude, Comment

User = get_user_model()

# Curated photos committed to the repo (see seed_media/CREDITS.md and docs/adr/0001).
SEED_MEDIA = Path(__file__).resolve().parents[4] / "seed_media"


def attach_file(field_file, target_name: str, source: Path) -> bool:
    """Copy `source` into storage at exactly `target_name` and point `field_file` at it.

    Idempotent: skips when the field already references `target_name` and the file exists.
    Returns True when a file was written (which triggers the image-processing signals).
    """
    if not source.exists():
        return False
    if field_file.name == target_name and default_storage.exists(target_name):
        return False
    if default_storage.exists(target_name):
        default_storage.delete(target_name)  # avoid Django's random-suffix renaming
    with source.open("rb") as fh:
        field_file.save(target_name.rsplit("/", 1)[-1], File(fh), save=True)
    return True

PRODUCTS = [
    {
        "title": "Hand-Thrown Stoneware Carafe",
        "image_alts": ["Grey stoneware jug on a turntable against a pale backdrop", "Cream pitcher with a relief snowdrop pattern", "Celadon-glazed vessel with a pale floral relief"],
        "subtitle": "A quiet pour for slow mornings",
        "description": (
            "Thrown on the wheel in a coastal studio, this carafe holds just enough water "
            "for two. The glaze shifts from mist grey to soft celadon depending on the light. "
            "Designed to sit on the table as an object, not disappear into the cupboard."
        ),
        "price": "68.00",
        "brand": "Atelier Nord",
        "maker_name": "Mira Solberg",
        "category": "Tableware",
        "tags": ["ceramic", "kitchen", "limited"],
        "attrs": [("Material", "Stoneware"), ("Origin", "Bergen, NO"), ("Edition", "120")],
        "editorial_score": 92,
        "inventory_count": 18,
    },
    {
        "title": "Linen Daybed Throw",
        "image_alts": ["Patterned throw draped over a low upholstered stool", "Soft printed fabric draped over a sofa beside a window", "Close detail of an undyed linen weave"],
        "subtitle": "Washed soft, weighted just right",
        "description": (
            "European flax linen, garment-washed until it drapes like a memory. "
            "The weave catches afternoon light; the weight settles without smothering. "
            "Meant for reading afternoons and borrowed evenings."
        ),
        "price": "145.00",
        "brand": "Field & Fold",
        "maker_name": "Field & Fold Atelier",
        "category": "Textiles",
        "tags": ["linen", "home", "soft"],
        "attrs": [("Material", "100% linen"), ("Size", "140 × 200 cm"), ("Color", "Oat")],
        "editorial_score": 88,
        "inventory_count": 24,
    },
    {
        "title": "Brass Desk Lamp No. 4",
        "image_alts": ["Brass banker’s lamp on a walnut base", "Brass desk lamp shade and hinge in profile", "Table lamp with a pleated shade glowing in a dim room"],
        "subtitle": "Warm pool light, hinged precision",
        "description": (
            "A counterweighted arm that stays where you leave it. Solid brass aged to a "
            "soft sheen, parchment shade that turns the bulb into a reading moon. "
            "Built to outlast trend cycles."
        ),
        "price": "320.00",
        "compare_at_price": "380.00",
        "brand": "Hinge Works",
        "maker_name": "Leo Park",
        "category": "Lighting",
        "tags": ["brass", "desk", "heirloom"],
        "attrs": [("Finish", "Unlacquered brass"), ("Bulb", "E14 LED"), ("Reach", "55 cm")],
        "editorial_score": 95,
        "inventory_count": 7,
    },
    {
        "title": "Cedar Incense Blocks",
        "image_alts": ["A curl of incense smoke rising against black", "A lit incense stick resting on a wooden board", "Bundles of incense smoking in a temple burner"],
        "subtitle": "Forest floor, distilled",
        "description": (
            "Pressed cedar and frankincense in small architectural blocks. "
            "Light one corner; the scent unfolds for forty quiet minutes. "
            "Packaged in recycled pulp trays—no plastic theater."
        ),
        "price": "28.00",
        "brand": "Smoke & Cedar",
        "maker_name": "Ana Ruiz",
        "category": "Ritual",
        "tags": ["scent", "ritual", "cedar"],
        "attrs": [("Burn time", "~40 min"), ("Notes", "Cedar, frankincense"), ("Count", "6 blocks")],
        "editorial_score": 81,
        "inventory_count": 60,
    },
    {
        "title": "Oak Cutting Board — Long Form",
        "image_alts": ["Wooden board with a juice groove on a workbench", "End-grain chopping block with a lemon", "Plain oak board with a turned handle"],
        "subtitle": "One plank, lifetime grain",
        "description": (
            "Quarter-sawn white oak with a juice groove that respects the edge. "
            "Oil-finished by hand. Large enough for a whole roast, calm enough for toast."
        ),
        "price": "110.00",
        "brand": "Grain Studio",
        "maker_name": "Jonah Wei",
        "category": "Tableware",
        "tags": ["wood", "kitchen"],
        "attrs": [("Wood", "White oak"), ("Size", "50 × 30 cm"), ("Finish", "Food-safe oil")],
        "editorial_score": 86,
        "inventory_count": 14,
    },
    {
        "title": "Wool Travel Blanket",
        "image_alts": ["Folded red and cream striped wool blanket", "Folded patterned wool travel rug with fringe", "A cat asleep on a grey knitted wool blanket"],
        "subtitle": "Cabin quiet for the commute",
        "description": (
            "Merino-blend twill that folds into its own leather strap. "
            "Warm without bulk—train seats, overnight flights, unexpected weather."
        ),
        "price": "198.00",
        "brand": "North Route",
        "maker_name": "North Route Co.",
        "category": "Textiles",
        "tags": ["wool", "travel"],
        "attrs": [("Fiber", "Merino blend"), ("Size", "130 × 180 cm"), ("Pack", "Leather strap")],
        "editorial_score": 90,
        "inventory_count": 11,
    },
    {
        "title": "Porcelain Pour-Over Set",
        "image_alts": ["Pour-over dripper and kettles on a dark counter", "Porcelain coffee dripper set on a white cup", "Overhead view of coffee being poured by hand"],
        "subtitle": "Clarity in three pieces",
        "description": (
            "Dripper, server, and cup in bone-white porcelain with a single indigo line. "
            "The dripper’s ridges slow the bloom; the server’s spout never dribbles. "
            "A morning ritual reduced to essentials."
        ),
        "price": "86.00",
        "brand": "Kettle Line",
        "maker_name": "Yuri Nakamura",
        "category": "Tableware",
        "tags": ["ceramic", "coffee", "ritual"],
        "attrs": [("Pieces", "3"), ("Capacity", "400 ml"), ("Origin", "Kyoto")],
        "editorial_score": 93,
        "inventory_count": 22,
    },
    {
        "title": "Wall Shelf — Floating Ash",
        "image_alts": ["White floating shelf with trailing plants and books", "Long low shelf filled with books", "Row of cloth-bound books on a wooden shelf"],
        "subtitle": "A ledge for the things you keep",
        "description": (
            "Solid ash with hidden brackets rated for real books, not just decor. "
            "Sand-smooth edges. Ships as one piece—no puzzle assembly."
        ),
        "price": "74.00",
        "brand": "Lineform",
        "maker_name": "Lineform Workshop",
        "category": "Furniture",
        "tags": ["wood", "storage"],
        "attrs": [("Length", "90 cm"), ("Depth", "18 cm"), ("Wood", "European ash")],
        "editorial_score": 84,
        "inventory_count": 30,
    },
]


class Command(BaseCommand):
    help = "Seed CurateShelf with editorial sample data"

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email="admin@curateshelf.local",
            defaults={"is_staff": True, "is_superuser": True},
        )
        admin.set_password("admin12345")
        admin.is_staff = True
        admin.is_superuser = True
        admin.is_active = True
        admin.save()

        editor, _ = User.objects.get_or_create(email="editor@curateshelf.local")
        editor.set_password("editor12345")
        editor.is_active = True
        editor.save()
        editor.profile.role = "editor"
        editor.profile.display_name = "Editorial Desk"
        editor.profile.save()

        reader, _ = User.objects.get_or_create(email="reader@curateshelf.local")
        reader.set_password("reader12345")
        reader.is_active = True
        reader.save()

        categories = {}
        for name in ["Tableware", "Textiles", "Lighting", "Ritual", "Furniture"]:
            cat, _ = Category.objects.get_or_create(
                slug=slugify(name), defaults={"name": name, "sort_order": len(categories)}
            )
            categories[name] = cat

        products = []
        for i, data in enumerate(PRODUCTS):
            tags = []
            for t in data["tags"]:
                tag, _ = Tag.objects.get_or_create(slug=slugify(t), defaults={"name": t.title()})
                tags.append(tag)

            slug = slugify(data["title"])
            product, created = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": data["title"],
                    "subtitle": data["subtitle"],
                    "description": data["description"],
                    "status": Product.Status.PUBLISHED,
                    "price": Decimal(data["price"]),
                    "compare_at_price": Decimal(data["compare_at_price"])
                    if data.get("compare_at_price")
                    else None,
                    "brand": data["brand"],
                    "maker_name": data["maker_name"],
                    "category": categories[data["category"]],
                    "editorial_score": data["editorial_score"],
                    "inventory_count": data["inventory_count"],
                    "published_at": timezone.now() - timezone.timedelta(days=len(PRODUCTS) - i),
                    "created_by": editor,
                    "reading_time_estimate": 3,
                    "sku": f"CS-{1000 + i}",
                },
            )
            product.tags.set(tags)
            product.attributes.all().delete()
            for order, (key, value) in enumerate(data["attrs"]):
                ProductAttribute.objects.create(
                    product=product, key=key, value=value, sort_order=order
                )
            self.attach_product_images(product, data.get("image_alts", []))
            products.append(product)
            self.stdout.write(f"{'Created' if created else 'Updated'} {product.title}")

        shelf, _ = Collection.objects.update_or_create(
            slug="quiet-mornings",
            defaults={
                "title": "Quiet Mornings",
                "description": "Objects that slow the first hour of the day.",
                "is_featured": True,
                "sort_order": 0,
            },
        )
        attach_file(shelf.cover, "shelves/quiet-mornings.jpg", SEED_MEDIA / "shelves" / "quiet-mornings.jpg")
        shelf.items.all().delete()
        for pos, product in enumerate(products[:4]):
            CollectionItem.objects.create(
                collection=shelf,
                product=product,
                position=pos,
                blurb=product.subtitle,
            )

        shelf2, _ = Collection.objects.update_or_create(
            slug="material-stories",
            defaults={
                "title": "Material Stories",
                "description": "Wood, brass, linen—textures with a past.",
                "is_featured": True,
                "sort_order": 1,
            },
        )
        attach_file(shelf2.cover, "shelves/material-stories.jpg", SEED_MEDIA / "shelves" / "material-stories.jpg")
        shelf2.items.all().delete()
        for pos, product in enumerate(products[3:7]):
            CollectionItem.objects.create(collection=shelf2, product=product, position=pos)

        Attitude.objects.update_or_create(
            user=reader, product=products[0], defaults={"kind": Attitude.Kind.LOVE}
        )
        Attitude.objects.update_or_create(
            user=reader, product=products[2], defaults={"kind": Attitude.Kind.CURIOUS}
        )
        products[0].love_count = 1
        products[0].save(update_fields=["love_count"])
        products[2].curious_count = 1
        products[2].save(update_fields=["curious_count"])
        reader.profile.loves_given = 1
        reader.profile.curious_given = 1
        reader.profile.save(update_fields=["loves_given", "curious_given"])

        if not Comment.objects.filter(product=products[0], author=reader).exists():
            parent = Comment.objects.create(
                product=products[0],
                author=reader,
                body="The glaze is even softer in person—caught the light at breakfast.",
            )
            Comment.objects.create(
                product=products[0],
                author=editor,
                parent=parent,
                body="Glad it found a morning table. Edition almost gone.",
            )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("Admin: admin@curateshelf.local / admin12345")
        self.stdout.write("Editor: editor@curateshelf.local / editor12345")
        self.stdout.write("Reader: reader@curateshelf.local / reader12345")
    def attach_product_images(self, product, alts):
        """Attach seed_media/products/<slug>/{cover,1,2}.jpg as cover + gallery media."""
        folder = SEED_MEDIA / "products" / product.slug
        if not folder.is_dir():
            self.stdout.write(self.style.WARNING(f"  no seed photos for {product.slug}"))
            return
        attach_file(product.cover_image, f"products/covers/{product.slug}.jpg", folder / "cover.jpg")

        # Gallery: the cover first, then the detail shots, so the product page carousel is complete.
        sources = [folder / "cover.jpg"] + sorted(p for p in folder.glob("*.jpg") if p.stem != "cover")
        for order, source in enumerate(sources):
            alt = alts[order] if order < len(alts) else product.title
            media = ProductMedia.objects.filter(product=product, sort_order=order).first()
            if media is None:
                media = ProductMedia(product=product, sort_order=order)
            media.alt_text = alt
            media.media_type = ProductMedia.MediaType.IMAGE
            if not attach_file(media.file, f"products/gallery/{product.slug}-{order}.jpg", source):
                media.save()
        product.media.filter(sort_order__gte=len(sources)).delete()
