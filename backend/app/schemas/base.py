"""Shared base schema for the customer-PWA-facing API surface.

All new storefront schemas (auth, products, cart, orders, prescriptions,
addresses, support, notifications) inherit from `CamelModel` so the JSON the
frontend receives is camelCase (matching its TypeScript types) while the
Python/DB layer stays snake_case - no manual field-by-field renaming needed.
The original voice-call-confirmation schemas (Customer, MedicineOrder, ...)
are untouched and keep their existing snake_case JSON shape.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
