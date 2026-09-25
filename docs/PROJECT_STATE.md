# PROJECT STATE

## Project
SALE HUNTER

Repository:
badat279-gh/sale-hunter

## Current Status
V0.1 SHOPEE PRODUCT RESOLVER - PASS
PRODUCT DIRECTION UPDATED

## Product Definition

Sale Hunter is a consumer-facing web application for people with no technical knowledge.

The user should NOT need to know about:
- shop_id
- item_id
- Python
- Node.js
- Playwright
- browser workers
- APIs
- Git
- terminal commands

The user experience must be:

Open website
→ Paste product link
→ Enter delivery address
→ Click search
→ Receive the best results for each marketplace.

## Supported Marketplaces

Primary:
1. Shopee Vietnam

Secondary:
2. TikTok Shop Vietnam
3. Lazada Vietnam

Development priority:

Shopee first
→ TikTok Shop
→ Lazada

The user interface may display all three marketplaces from the beginning, but marketplace engines should only be enabled after they are technically validated.

## Core User Goal

The user pastes ONE product link from:

- Shopee
- TikTok Shop
- Lazada

The system identifies the exact product and variant.

Then it searches for the same product on each supported marketplace.

Each marketplace is ranked independently.

Example output:

Shopee:
- Best result #1
- Best result #2
- Best result #3

TikTok Shop:
- Best result #1
- Best result #2
- Best result #3

Lazada:
- Best result #1
- Best result #2
- Best result #3

Default output:
Top 3 per marketplace.

Future option:
Top 5 or Top 10.

## Meaning of "Best Result"

A result is NOT ranked only by displayed listing price.

The ranking target is the lowest realistic payable price for the user.

Expected formula:

FINAL PRICE =
PRODUCT PRICE
- PRODUCT DISCOUNT
- SHOP VOUCHER
- PLATFORM VOUCHER
- CATEGORY VOUCHER
- ELIGIBLE PAYMENT DISCOUNT
- ELIGIBLE COINS / BONUS
+ REAL SHIPPING FEE

Only valid and applicable discounts should be counted.

If a discount is conditional, the UI must clearly explain the condition.

Example:

Bank voucher:
-100,000 VND
Only if payment is made using the supported bank/card.

The system must not present uncertain discounts as guaranteed final prices.

## Delivery Address

The user can enter a delivery address.

The address is part of the deal calculation.

Address may affect:

- shipping fee
- free shipping eligibility
- delivery region
- seller availability
- delivery speed
- platform promotions
- regional restrictions

The first useful address level may be:

- Province / City
- District
- Ward

Later versions may support:
- full street address
- saved delivery profiles

## Account Connection

To calculate personalized discounts accurately, the web application may allow the user to connect marketplace sessions.

Example UI:

Shopee       Connected / Connect
TikTok Shop  Connected / Connect
Lazada       Connected / Connect

Technical browser login/session handling must remain hidden from the normal user.

## Current Architecture

Frontend:
- Planned: Next.js / React

Backend:
- Planned: FastAPI / Python

Marketplace browser workers:
- Node.js
- CloakBrowser / Playwright where required
- Persistent authenticated marketplace sessions

Database:
- Planned: PostgreSQL

Queue/cache:
- Planned: Redis

Local AI:
- Optional
- Only when deterministic product matching is insufficient

## Current Version

V0.1 - Shopee Product Resolver

## Completed

### Project foundation
- GitHub repository created.
- Base directory structure created.
- AGENTS.md created.
- ROADMAP created.
- Git workflow established.

### Shopee URL Resolver
- Validate Shopee Vietnam URLs.
- Parse standard Shopee product URLs.
- Extract shop_id.
- Extract item_id.
- Generate canonical product URL.
- Detect Shopee short URLs.
- Resolve real s.shopee.vn short links.
- Real Shopee short-link test passed.

### Shopee Browser Worker
- Node.js worker created.
- CloakBrowser installed.
- Playwright installed.
- Persistent Shopee profile created.
- Shopee login session stored.
- pdp/get_pc response successfully captured.

### Real Shopee Product Detail
Successfully extracted:

- shop_id
- item_id
- title
- displayed price
- currency
- main image
- shop name
- shop location

Real tested product:
- shop_id: 423697084
- item_id: 23032598294

## Tests Passed

Python URL resolver:
- 8/8 automated tests PASS.

Real Shopee short URL:
- PASS.

Shopee authenticated browser:
- PASS.

Shopee pdp/get_pc:
- PASS.

Real Shopee product detail:
- PASS.

## Known Issues

- PowerShell may display some Vietnamese Unicode characters incorrectly.
- Web UI should use UTF-8 and should not inherit this terminal limitation.
- Marketplace anti-bot behavior may change.
- Personalized vouchers may require an authenticated marketplace session.
- Not every voucher can be treated as guaranteed without validating eligibility.

## Currently Working On

V0.1.5 - Consumer Web Shell

## Next Exact Step

Build the first consumer-facing website shell.

The web UI must initially support:

1. Product link input.
2. Delivery address input.
3. Marketplace connection status.
4. Search button.
5. Source product preview.
6. Marketplace result sections:
   - Shopee
   - TikTok Shop
   - Lazada

At this stage:
- Shopee product preview should use the already validated resolver/product-detail pipeline.
- Search/ranking does not need to be complete yet.
- TikTok Shop and Lazada may appear as "Coming soon" or disabled.

Do not start advanced product matching before the first usable web shell exists.

---

## Architecture Decision - Replaceable Marketplace Adapters

Marketplace acquisition logic must never become the core of Sale Hunter.

Target architecture:

MarketplaceAdapter
├── ShopeeAdapter
│   ├── Resolver
│   ├── Product Detail
│   ├── Search
│   ├── Promotions
│   ├── Shipping
│   └── Final Price Inputs
├── TikTokShopAdapter
└── LazadaAdapter

For Shopee, the current implementation uses an authenticated browser worker that intercepts responses produced by Shopee's own web application.

This is an implementation detail, not a permanent dependency.

Future Shopee data sources may include:
- Official APIs
- Partner APIs
- Affiliate APIs
- Browser-assisted capture
- Other compliant data sources

The rest of Sale Hunter must consume normalized marketplace data and must not depend on Shopee-specific response schemas.

If Shopee changes its internal web schema, only ShopeeAdapter should require modification.

## V0.2-A Shopee Search

Status: PASS

Validated with a real authenticated Shopee Vietnam session.

The search engine can currently return real candidate listings containing:

- item_id
- shop_id
- title
- displayed price
- original price
- discount
- currency
- main image
- shop name
- shop location
- historical sold count
- monthly sold count
- rating
- verified status
- sold-out status
- direct product URL

Shopee Vietnam search currently exposes normalized product data primarily through:
- item_data
- item_card_displayed_asset

The adapter normalizes those Shopee-specific structures before returning data to Sale Hunter.

## Next Exact Step

V0.2-B - Expose Shopee search through the web application.

Flow:

Source product
→ derive search query
→ ShopeeAdapter search
→ return candidate listings
→ display candidates on the website

Important:
These are SEARCH CANDIDATES only.

Do not label them "best price" yet.

Product Matching must run before ranking.

---

## V0.3 - Product Matching Pipeline

Status: PASS

Validated end-to-end with a real Shopee Vietnam product.

Current pipeline:

Source product
→ derive model/search queries
→ multi-query Shopee search
→ multi-page discovery
→ deduplicate candidates
→ category filter
→ normalized text/model matching
→ shortlist candidates
→ image perceptual-hash comparison
→ final hybrid match decision

Current matching statuses:

- confirmed
- possible
- rejected

Safety rule:

If there is not enough evidence that two listings are the same product,
the candidate must NOT be treated as an equivalent product.

A missing result is preferable to a false product match.

### Validated real test

Source product:
Abi Mini Bag - BARAS

Automated pipeline result:

- 4 generated search queries
- pages 0, 1, 2
- 718 raw collected results
- 492 unique candidates
- 172 candidates after category filter
- 172 text-matched candidates
- 30 image-checked candidates
- 0 confirmed
- 0 possible
- 30 rejected

This result is considered correct for the tested product because the system did not falsely accept other BARAS models such as:

- Rumba Bag
- Morgan Bag
- Enzo Bag
- Murphy Bag
- Miller Bag
- Jackson Bag
- Paxton Bag
- Titanus Bag

### Matching components now implemented

- dynamic source title
- dynamic source shop
- dynamic source category
- dynamic source image
- model phrase extraction
- model conflict rejection
- category filtering
- text similarity
- image similarity using perceptual hash
- hybrid final score
- multi-query discovery
- multi-page discovery
- candidate deduplication

### Current implementation detail

Image matching currently uses:

- Pillow
- ImageHash
- perceptual hash (pHash)

Python dependencies are documented in:

packages/product-matcher/requirements.txt

### Next Exact Step

V0.3-F3 - Connect the automatic product-matching pipeline to the web backend and consumer UI.

Target user flow:

Paste Shopee link
→ source product is detected
→ automatic discovery runs
→ product matching runs
→ confirmed / possible matches are shown
→ rejected candidates remain hidden by default

No manual JSON files or terminal matcher steps should be required.

---

## V0.3-F3 - Consumer Web Matching Integration

Status: PASS

The automatic product-matching pipeline is now connected to the consumer web application.

User flow:

Paste Shopee link
→ identify source product
→ automatically run multi-query / multi-page discovery
→ category filter
→ text/model matching
→ image matching
→ show confirmed / possible results

Rejected candidates remain hidden by default.

Validated real UI test:

Source:
Abi Mini Bag - BARAS

Observed result:

- 509 unique products scanned
- 173 same-category candidates
- 30 image-checked candidates
- 0 confirmed
- 0 possible

The UI correctly displayed:

"Chưa tìm thấy shop khác được xác nhận bán cùng sản phẩm"

The old raw-search candidate grid is no longer used as the consumer result.

No terminal matcher workflow is required for the normal user.

## Next Exact Step

V0.3-G - Runtime optimization.

Priorities:

1. Run independent search queries/pages concurrently where safe.
2. Cache search results.
3. Cache downloaded image hashes.
4. Avoid repeated source-image downloads.
5. Add early stopping when enough high-confidence matches are found.
6. Measure real end-to-end runtime.

After runtime optimization and stability checks:

V0.4 - Delivery Address Engine.
