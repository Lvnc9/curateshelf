from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.catalog.models import Category, Product, ProductAttribute, Tag
from apps.editorial.models import Collection, CollectionItem
from apps.engagement.models import Attitude, Comment

User = get_user_model()

PRODUCTS = [
    {
        "title": "Hand-Thrown Stoneware Carafe",
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