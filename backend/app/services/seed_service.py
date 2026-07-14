"""
One-time seed data for the storefront catalogue (pharmacies, categories,
products). Mirrors the fixtures the customer-pwa frontend used to ship as
static mock data, now persisted in Postgres so the same catalogue is served
by a real API. Runs automatically on startup only when the `products` table
is empty (see app.main.on_startup), so it never overwrites pharmacist edits.
"""

import logging

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.pharmacy import Pharmacy
from app.models.product import Product

logger = logging.getLogger("medicall.seed_service")

_DISCLAIMER = "For information only. Always read the label and follow pharmacist guidance before use."

_PHARMACIES = [
    {
        "slug": "pharm-01",
        "name": "MediCall Central Pharmacy",
        "city": "Colombo",
        "opening_hours": "7:00 AM - 10:00 PM",
        "phone_number": "+94112345678",
    },
    {
        "slug": "pharm-02",
        "name": "MediCall Wellness Pharmacy - Kandy",
        "city": "Kandy",
        "opening_hours": "8:00 AM - 9:00 PM",
        "phone_number": "+94812345678",
    },
    {
        "slug": "pharm-03",
        "name": "MediCall Express Pharmacy - Galle",
        "city": "Galle",
        "opening_hours": "24 hours",
        "phone_number": "+94912345678",
    },
]

_CATEGORIES = [
    {"slug": "cat-medicines", "name": "Medicines", "icon": "Pill"},
    {"slug": "cat-first-aid", "name": "First Aid", "icon": "Cross"},
    {"slug": "cat-personal-care", "name": "Personal Care", "icon": "Droplets"},
    {"slug": "cat-baby-care", "name": "Baby Care", "icon": "Baby"},
    {"slug": "cat-wellness", "name": "Wellness", "icon": "HeartPulse"},
    {"slug": "cat-medical-equipment", "name": "Medical Equipment", "icon": "Stethoscope"},
]

# slug -> (pharmacy_slug, category_slug, product fields...). `related` refers
# to other product slugs, resolved to real ids in a second pass below.
_PRODUCTS = [
    dict(slug="prod-01", name="Adhesive Bandages (Assorted, 40 pcs)", brand="CareStrip",
         manufacturer="CareStrip Medical Supplies", category="cat-first-aid",
         description=f"Assorted washable, breathable adhesive bandages for minor cuts and grazes. {_DISCLAIMER}",
         storage_information="Store in a cool, dry place below 30C.", image="bandages", price=450,
         pack_size="40 pieces", stock_quantity=120, prescription_required=False, pharmacy="pharm-01",
         rating=4.6, related=["prod-02", "prod-09"]),
    dict(slug="prod-02", name="Digital Thermometer", brand="TempSure", manufacturer="TempSure Devices",
         category="cat-medical-equipment",
         description=f"Fast 60-second oral/underarm digital thermometer with fever alert beep. {_DISCLAIMER}",
         storage_information="Store away from direct sunlight. Keep dry.", image="thermometer", price=1250,
         pack_size="1 unit", stock_quantity=40, prescription_required=False, pharmacy="pharm-01",
         rating=4.8, related=["prod-16", "prod-09"]),
    dict(slug="prod-03", name="Hand Sanitiser Gel 500ml", brand="PureGuard", manufacturer="PureGuard Hygiene",
         category="cat-personal-care",
         description=f"70% alcohol-based hand sanitiser gel that kills 99.9% of germs. {_DISCLAIMER}",
         storage_information="Store below 25C, away from flame. Keep cap tightly closed.", image="sanitiser",
         price=650, pack_size="500 ml", stock_quantity=200, prescription_required=False, pharmacy="pharm-01",
         rating=4.5, related=["prod-04", "prod-08"]),
    dict(slug="prod-04", name="Disposable Face Masks (50 pcs)", brand="BreatheEasy",
         manufacturer="BreatheEasy Protective Gear", category="cat-personal-care",
         description=f"3-ply disposable face masks with soft ear loops for daily protection. {_DISCLAIMER}",
         storage_information="Store in original packaging in a clean, dry place.", image="mask", price=900,
         pack_size="50 pieces", stock_quantity=300, prescription_required=False, pharmacy="pharm-02",
         rating=4.4, related=["prod-03"]),
    dict(slug="prod-05", name="Baby Wipes Fragrance Free (80 pcs)", brand="TinyCare",
         manufacturer="TinyCare Baby Products", category="cat-baby-care",
         description="Gentle, fragrance-free wipes suitable for newborn sensitive skin.",
         storage_information="Reseal pack after each use to keep wipes moist.", image="wipes", price=780,
         pack_size="80 pieces", stock_quantity=150, prescription_required=False, pharmacy="pharm-02",
         rating=4.7, related=["prod-06"]),
    dict(slug="prod-06", name="First Aid Kit (Home Essentials)", brand="CareStrip",
         manufacturer="CareStrip Medical Supplies", category="cat-first-aid",
         description=f"Complete home first-aid kit with bandages, antiseptic wipes, scissors and gloves. {_DISCLAIMER}",
         storage_information="Store in a cool, dry place. Check contents periodically.", image="firstaidkit",
         price=3200, pack_size="1 kit", stock_quantity=60, prescription_required=False, pharmacy="pharm-01",
         rating=4.9, related=["prod-01", "prod-07"]),
    dict(slug="prod-07", name="Antiseptic Wipes (100 pcs)", brand="CareStrip",
         manufacturer="CareStrip Medical Supplies", category="cat-first-aid",
         description=f"Alcohol-free antiseptic wipes for cleaning minor wounds and skin surfaces. {_DISCLAIMER}",
         storage_information="Store below 25C. Do not use if pouch is damaged.", image="wipesantiseptic",
         price=550, pack_size="100 pieces", stock_quantity=180, prescription_required=False, pharmacy="pharm-01",
         rating=4.5, related=["prod-01", "prod-06"]),
    dict(slug="prod-08", name="Moisturising Body Lotion 400ml", brand="SoftSkin",
         manufacturer="SoftSkin Cosmeceuticals", category="cat-personal-care",
         description="Non-greasy daily moisturising lotion for normal to dry skin.",
         storage_information="Store below 30C. Keep bottle tightly closed.", image="lotion", price=980,
         pack_size="400 ml", stock_quantity=90, prescription_required=False, pharmacy="pharm-02",
         rating=4.3, related=["prod-03"]),
    dict(slug="prod-09", name="Cotton Pads (100 pcs)", brand="PureGuard", manufacturer="PureGuard Hygiene",
         category="cat-personal-care", description="Soft, absorbent cotton pads for general hygiene and wound care use.",
         storage_information="Store in a dry place away from direct sunlight.", image="cottonpads", price=320,
         pack_size="100 pieces", stock_quantity=220, prescription_required=False, pharmacy="pharm-01",
         rating=4.2, related=["prod-01", "prod-07"]),
    dict(slug="prod-10", name="Oral Rehydration Salts (Sachets x10)", brand="HydraBalance",
         manufacturer="HydraBalance Nutraceuticals", category="cat-wellness",
         description=f"Rehydration salt sachets to help replace fluids and minerals. {_DISCLAIMER}",
         storage_information="Store below 25C. Use prepared solution within 1 hour.", image="ors", price=480,
         pack_size="10 sachets", stock_quantity=140, prescription_required=False, pharmacy="pharm-03",
         rating=4.6, related=["prod-17"]),
    dict(slug="prod-11", name="Amoxicillin 500mg Capsules", brand="PharmaLine", generic_name="Amoxicillin",
         manufacturer="PharmaLine Laboratories", category="cat-medicines",
         description="Prescription antibiotic. A valid, pharmacist-approved prescription is required before this "
                     "item can be dispensed.",
         storage_information="Store below 25C in original packaging, protected from light.", image="capsule",
         price=1150, pack_size="21 capsules", stock_quantity=75, prescription_required=True, pharmacy="pharm-01",
         rating=4.7, related=["prod-12"]),
    dict(slug="prod-12", name="Cetirizine 10mg Tablets", brand="AllerCare", generic_name="Cetirizine hydrochloride",
         manufacturer="AllerCare Pharma", category="cat-medicines",
         description="Prescription-labelled placeholder product for allergy relief. Requires pharmacist-approved "
                     "prescription.",
         storage_information="Store below 30C. Keep out of reach of children.", image="tablet", price=620,
         pack_size="30 tablets", stock_quantity=65, prescription_required=True, pharmacy="pharm-01",
         rating=4.5, related=["prod-11"]),
    dict(slug="prod-13", name="Metformin 500mg Tablets", brand="GlucoCare", generic_name="Metformin hydrochloride",
         manufacturer="GlucoCare Pharma", category="cat-medicines",
         description="Prescription-labelled placeholder product. Requires pharmacist-approved prescription before "
                     "dispensing.",
         storage_information="Store below 25C in a dry place.", image="tablet", price=890,
         pack_size="60 tablets", stock_quantity=50, prescription_required=True, pharmacy="pharm-02",
         rating=4.4, related=["prod-11"]),
    dict(slug="prod-14", name="Paracetamol 500mg Tablets", brand="FeverEase", generic_name="Paracetamol",
         manufacturer="FeverEase Pharma", category="cat-medicines",
         description=f"Widely used over-the-counter pain and fever relief tablets. {_DISCLAIMER}",
         storage_information="Store below 30C. Keep out of reach of children.", image="tablet", price=280,
         pack_size="20 tablets", stock_quantity=400, prescription_required=False, pharmacy="pharm-01",
         rating=4.8, related=["prod-15"]),
    dict(slug="prod-15", name="Ibuprofen 200mg Tablets", brand="FlexRelief", generic_name="Ibuprofen",
         manufacturer="FlexRelief Pharma", category="cat-medicines",
         description=f"Over-the-counter anti-inflammatory tablets for minor aches and pains. {_DISCLAIMER}",
         storage_information="Store below 25C, protected from moisture.", image="tablet", price=340,
         pack_size="24 tablets", stock_quantity=260, prescription_required=False, pharmacy="pharm-03",
         rating=4.6, related=["prod-14"]),
    dict(slug="prod-16", name="Digital Blood Pressure Monitor", brand="PulseCheck", manufacturer="PulseCheck Devices",
         category="cat-medical-equipment",
         description=f"Automatic upper-arm blood pressure monitor with large display and memory storage. {_DISCLAIMER}",
         storage_information="Store in the provided case away from moisture.", image="bpmonitor", price=6800,
         pack_size="1 unit", stock_quantity=25, prescription_required=False, pharmacy="pharm-02",
         rating=4.7, related=["prod-02"]),
    dict(slug="prod-17", name="Multivitamin Effervescent Tablets (Tube of 20)", brand="VitaBoost",
         manufacturer="VitaBoost Nutraceuticals", category="cat-wellness",
         description=f"Daily multivitamin effervescent tablets to support general wellbeing. {_DISCLAIMER}",
         storage_information="Store tube tightly closed, below 25C.", image="vitamins", price=1450,
         pack_size="20 tablets", stock_quantity=110, prescription_required=False, pharmacy="pharm-03",
         rating=4.5, related=["prod-10"]),
    dict(slug="prod-18", name="Baby Diaper Rash Cream 100g", brand="TinyCare", manufacturer="TinyCare Baby Products",
         category="cat-baby-care", description="Soothing barrier cream to help protect baby's skin from diaper rash.",
         storage_information="Store below 30C. Close cap tightly after use.", image="rashcream", price=690,
         pack_size="100 g", stock_quantity=130, prescription_required=False, pharmacy="pharm-02",
         rating=4.6, related=["prod-05"]),
    dict(slug="prod-19", name="Baby Feeding Bottle 250ml", brand="TinyCare", manufacturer="TinyCare Baby Products",
         category="cat-baby-care", description="BPA-free anti-colic feeding bottle with soft silicone teat.",
         storage_information="Sterilise before first use and store in a clean, dry place.", image="bottle",
         price=1100, pack_size="1 unit", stock_quantity=70, prescription_required=False, pharmacy="pharm-02",
         rating=4.4, related=["prod-05", "prod-18"]),
    dict(slug="prod-20", name="Elastic Crepe Bandage 4-inch", brand="CareStrip",
         manufacturer="CareStrip Medical Supplies", category="cat-first-aid",
         description=f"Stretchable crepe bandage for supporting sprains and securing dressings. {_DISCLAIMER}",
         storage_information="Store flat in a cool, dry place.", image="crepe", price=390,
         pack_size="1 roll", stock_quantity=160, prescription_required=False, pharmacy="pharm-03",
         rating=4.3, related=["prod-06"]),
    dict(slug="prod-21", name="Pulse Oximeter Fingertip", brand="PulseCheck", manufacturer="PulseCheck Devices",
         category="cat-medical-equipment",
         description="Fingertip device for checking blood oxygen saturation (SpO2) and pulse rate.",
         storage_information="Store in a dry place. Remove batteries if unused for long periods.", image="oximeter",
         price=2400, pack_size="1 unit", stock_quantity=0, prescription_required=False, pharmacy="pharm-01",
         rating=4.6, related=["prod-16", "prod-02"]),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Product).first() is not None:
        return

    logger.info("Seeding storefront catalogue (pharmacies, categories, products)...")

    pharmacies_by_slug = {}
    for row in _PHARMACIES:
        pharmacy = Pharmacy(
            name=row["name"], city=row["city"], opening_hours=row["opening_hours"],
            phone_number=row["phone_number"], is_open_now=True,
        )
        db.add(pharmacy)
        pharmacies_by_slug[row["slug"]] = pharmacy

    categories_by_slug = {}
    for row in _CATEGORIES:
        category = Category(slug=row["slug"], name=row["name"], icon=row["icon"])
        db.add(category)
        categories_by_slug[row["slug"]] = category

    db.flush()

    products_by_slug = {}
    for row in _PRODUCTS:
        product = Product(
            name=row["name"],
            brand=row["brand"],
            generic_name=row.get("generic_name"),
            manufacturer=row["manufacturer"],
            category_id=categories_by_slug[row["category"]].id,
            description=row["description"],
            storage_information=row["storage_information"],
            image=row["image"],
            price=row["price"],
            pack_size=row["pack_size"],
            stock_quantity=row["stock_quantity"],
            prescription_required=row["prescription_required"],
            pharmacy_id=pharmacies_by_slug[row["pharmacy"]].id,
            rating=row["rating"],
            related_product_ids=[],
        )
        db.add(product)
        products_by_slug[row["slug"]] = product

    db.flush()

    for row in _PRODUCTS:
        product = products_by_slug[row["slug"]]
        product.related_product_ids = [products_by_slug[slug].id for slug in row["related"] if slug in products_by_slug]

    db.commit()
    logger.info("Seeded %d pharmacies, %d categories, %d products.", len(_PHARMACIES), len(_CATEGORIES), len(_PRODUCTS))
