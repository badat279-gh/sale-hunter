# SALE HUNTER ROADMAP

## V0.0 - FOUNDATION

### V0.0.1
- Repository
- Project documentation
- Base folder structure
- Git workflow

Status: CURRENT

---

## V0.1 - SHOPEE PRODUCT RESOLVER

Goal:
Paste a Shopee URL and identify the exact product.

Required output:

- Original URL
- Canonical URL
- shop_id
- item_id
- Product title
- Main image
- Current displayed price
- Shop name

PASS condition:
A real Shopee Vietnam product URL can be resolved consistently.

---

## V0.2 - SHOPEE SEARCH

Goal:
Given the source product, search Shopee for possible equivalent listings.

Required:

- Keyword generation
- Search result collection
- Pagination
- Seller information
- Price
- Rating
- Sold count
- Location

PASS condition:
System returns multiple candidate listings from a source product.

---

## V0.3 - PRODUCT MATCHING

Goal:
Determine which search results represent the same actual product.

Matching priority:

1. Brand
2. Model
3. SKU
4. Variant
5. Category
6. Normalized product title
7. Text similarity
8. Image similarity when required

PASS condition:
Unrelated products are rejected and equivalent listings are retained.

---

## V0.4 - PRICE COMPARISON

Goal:
Rank confirmed equivalent Shopee listings.

First stage:

Displayed product price.

Later stages:

- Shop discount
- Shopee promotion
- Voucher
- Shipping
- Payment discount
- Coins when applicable

Final formula:

FINAL PRICE =
PRODUCT PRICE
- VALID DISCOUNTS
+ SHIPPING

PASS condition:
System produces a ranked list with explainable price calculation.

---

## V0.5 - SHOPEE DEAL ENGINE

Goal:
Calculate the realistic payable price for the selected buyer context.

Inputs may include:

- Delivery region
- Voucher eligibility
- Shop voucher
- Platform voucher
- Shipping promotion
- Payment method
- User-specific promotions

---

## V0.6 - WEB MVP

Minimal interface:

Paste product URL
→ Search
→ Show original product
→ Show matching products
→ Show cheapest options

No unnecessary dashboard features.

---

## V0.7 - PRICE HISTORY

- Save observations
- Historical chart
- Lowest recorded price
- Detect price changes

---

## V0.8 - TIKTOK SHOP ADAPTER

Only begin after Shopee is stable.

Required:

- URL resolver
- Product detail
- Search
- Product matching
- Price normalization

TikTok Shop output must conform to MarketplaceAdapter.

---

## V0.9 - CROSS MARKETPLACE DEAL ENGINE

Compare:

Shopee
vs
TikTok Shop

Rank by normalized final payable price.

---

## FUTURE

Possible later functionality:

- Price alerts
- Affiliate links
- Browser extension
- Mobile-friendly PWA
- Personalized deal profiles
- Local AI product understanding
- Image-based product search

These features must not block the core Shopee MVP.
