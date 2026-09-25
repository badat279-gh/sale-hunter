# SALE HUNTER ROADMAP

## PRODUCT GOAL

Sale Hunter is a simple web app for normal users.

Main flow:

Paste product link
→ Enter delivery address
→ Identify exact product
→ Search supported marketplaces
→ Calculate realistic payable prices
→ Return the best results independently for each marketplace

Supported marketplaces:

1. Shopee Vietnam
2. TikTok Shop Vietnam
3. Lazada Vietnam

Development priority:

Shopee
→ TikTok Shop
→ Lazada

---

# V0.0 - FOUNDATION

## V0.0.1
- GitHub repository
- Project documentation
- Base folder structure
- Git workflow

Status: PASS

---

# V0.1 - SHOPEE PRODUCT RESOLVER

Goal:
Read a real Shopee product from a pasted link.

Completed:

- Full Shopee URL parser
- Short-link resolver
- shop_id extraction
- item_id extraction
- canonical URL
- persistent authenticated browser session
- Shopee pdp/get_pc response capture
- product title
- displayed price
- currency
- main image
- shop name
- shop location

Status: PASS

---

# V0.1.5 - CONSUMER WEB SHELL

Goal:
Create the first website usable by a non-technical person.

Initial route:

http://localhost:3000

Main UI:

- Product link input
- Delivery address input
- Search button
- Marketplace account status
- Source product preview

Marketplace sections:

Shopee
TikTok Shop
Lazada

Initial behavior:

Shopee:
- active

TikTok Shop:
- disabled / coming soon

Lazada:
- disabled / coming soon

PASS condition:

A normal user can open the website, paste a Shopee link, enter an address, click search, and see the source Shopee product information without using terminal commands.

---

# V0.2 - SHOPEE SEARCH

Goal:
Search Shopee for candidate listings related to the source product.

Pipeline:

Source product
→ Generate search query
→ Shopee search
→ Capture candidate listings

Required candidate data:

- item_id
- shop_id
- title
- displayed price
- image
- sold count
- rating
- seller location
- product URL

Initial search should collect more candidates than final results.

Example:

50-100 search candidates
→ later matching/filtering
→ final Top N

PASS condition:

Search candidates can be captured reliably from Shopee Vietnam.

---

# V0.3 - PRODUCT MATCHING

Goal:
Determine which candidate listings are genuinely the same product.

Matching priority:

1. Brand
2. Model
3. SKU
4. Variant
5. Category
6. Normalized title
7. Product attributes
8. Text similarity
9. Image similarity if required

The system must avoid comparing different variants as if they were identical.

Example:

128GB
must not be ranked against
256GB

unless the user explicitly allows variant alternatives.

PASS condition:

Equivalent listings are retained.
Incorrect products are rejected.

---

# V0.4 - DELIVERY ADDRESS ENGINE

Goal:
Use the user's delivery location when calculating deals.

Initial address fields:

- Province / City
- District
- Ward

Later:

- Full address
- Saved profiles

Address should affect:

- shipping fee
- free shipping
- delivery eligibility
- seller region
- delivery time
- location-specific promotions

PASS condition:

The same product can produce different final costs for different delivery locations.

---

# V0.5 - SHOPEE DEAL ENGINE

Goal:
Calculate the best realistic payable price for each valid listing.

Potential components:

- Product discount
- Flash sale
- Shop voucher
- Shopee platform voucher
- Category voucher
- Free shipping
- Shipping fee
- Payment voucher
- Coins when actually usable
- Account-specific discount when verifiable

Formula:

FINAL PRICE =
PRODUCT PRICE
- VALID DISCOUNTS
+ SHIPPING

Every applied discount should be explainable in the UI.

PASS condition:

Each listing has an auditable price breakdown.

---

# V0.6 - SHOPEE TOP RESULTS

Goal:
Return the best results inside Shopee.

Default:
Top 3

Options later:
Top 5
Top 10

Important:

The ranking is independent within Shopee.

The winner is based on final payable price, not listing price.

PASS condition:

The user sees the best Shopee links sorted by realistic final price.

---

# V0.7 - TIKTOK SHOP ADAPTER

Goal:
Implement the same marketplace interface for TikTok Shop.

Required:

- URL resolver
- Product detail
- Search
- Product matching
- Delivery-aware price
- Voucher/discount data
- Final price
- Top N TikTok Shop results

TikTok Shop results are ranked independently from Shopee.

---

# V0.8 - LAZADA ADAPTER

Goal:
Implement the same marketplace interface for Lazada Vietnam.

Required:

- URL resolver
- Product detail
- Search
- Product matching
- Delivery-aware price
- Voucher/discount data
- Final price
- Top N Lazada results

Lazada results are ranked independently.

---

# V0.9 - MULTI-MARKETPLACE EXPERIENCE

Input:
One Shopee / TikTok Shop / Lazada product link.

Output:

Shopee:
Top N best results

TikTok Shop:
Top N best results

Lazada:
Top N best results

Each marketplace is ranked independently.

The UI may also show an optional overall lowest price, but this must not replace the separate marketplace rankings.

---

# V1.0 - CONSUMER MVP

Target user flow:

1. Open Sale Hunter.
2. Paste product link.
3. Enter delivery address.
4. Connect marketplace account if required.
5. Click "Find best price".
6. Review Top results for each marketplace.
7. See full price breakdown.
8. Open the chosen marketplace listing.

No terminal usage should be required.

---

# FUTURE

Possible later features:

- Price history
- Price alerts
- Saved products
- Saved addresses
- Affiliate links
- Browser extension
- PWA/mobile install
- Personalized deal profile
- Automatic re-check
- Barcode/product-image search

These features must not block the core deal engine.

---

# ARCHITECTURE RULE - MARKETPLACE ADAPTERS

All marketplace-specific acquisition methods must stay behind replaceable adapters.

The consumer website, product matcher and deal engine must work with normalized marketplace objects instead of raw Shopee/TikTok/Lazada response structures.

Current Shopee acquisition method:

Authenticated browser session
→ Shopee web page
→ Shopee-generated internal response
→ ShopeeAdapter normalization

This may later be replaced by an official, partner or affiliate API without redesigning the rest of Sale Hunter.

---

# V0.2-A - SHOPEE SEARCH CAPTURE

Status: PASS

Validated against Shopee Vietnam.

Current search output includes:

- item_id
- shop_id
- title
- price
- original_price
- discount
- image
- shop_name
- shop_location
- sold
- monthly_sold
- rating
- verified
- product_url

Next:

V0.2-B
Connect normalized Shopee search candidates to the consumer web UI.

After that:

V0.3
Product Matching

Only after matching:

V0.4+
Deal / voucher / shipping / final-price ranking

---

# V0.3 IMPLEMENTATION STATUS

Status: CORE PIPELINE PASS

Implemented:

- Dynamic source product matching
- Model phrase extraction
- Model conflict detection
- Multi-query search discovery
- Multi-page search
- Candidate deduplication
- Category filtering
- Text similarity
- Image pHash similarity
- Hybrid match scoring
- Confirmed / Possible / Rejected statuses

Validated real pipeline:

4 search queries
× 3 Shopee pages
→ 718 raw candidates
→ 492 unique candidates
→ 172 same-category candidates
→ 30 image-checked finalists
→ 0 false confirmed results

Important matching rule:

Different product models must not be promoted only because:
- they are from the same shop,
- titles are similar,
- or product photos look visually similar.

If confidence is insufficient, return no equivalent listing.

Next:

V0.3-F3
Connect the automatic matching pipeline to the consumer web application.

After web integration:

V0.3-G
Optimize runtime with:
- parallel search execution
- search cache
- image-hash cache
- early stopping
- reduced duplicate browser work

Only after reliable product matching:

V0.4
Delivery Address Engine
