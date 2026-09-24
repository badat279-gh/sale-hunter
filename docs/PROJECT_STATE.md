# PROJECT STATE

## Project
SALE HUNTER

Repository:
badat279-gh/sale-hunter

## Current Status
V0.1 SHOPEE PRODUCT RESOLVER - PASS

## Main Objective

Build a self-hosted sale hunting application focused primarily on Shopee Vietnam.

A user will paste a product link and the system will:

1. Identify the product.
2. Find equivalent listings.
3. Compare sellers.
4. Calculate discounts and shipping.
5. Determine the real payable price.
6. Return the cheapest valid option.

TikTok Shop will be added after the Shopee pipeline is stable.

## Current Architecture

Frontend:
- Planned: Next.js / React

Backend:
- Planned: FastAPI / Python

Shopee browser worker:
- Node.js
- CloakBrowser
- Playwright
- Persistent authenticated Shopee session

Database:
- Planned: PostgreSQL

Queue/cache:
- Planned: Redis

Local AI:
- Optional later

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
- CloakBrowser installed.
- Playwright installed.
- Persistent Shopee browser profile created.
- Shopee login session successfully stored.
- Shopee anti-bot protected pdp/get_pc response successfully captured.

### Real Product Detail
Successfully retrieved from a real Shopee Vietnam product:

- shop_id
- item_id
- title
- displayed price
- currency
- main image
- shop name
- shop location

Real test product:
- shop_id: 423697084
- item_id: 23032598294

## Tests Passed

Python URL resolver:
- 8/8 automated tests PASS.

Real Shopee short URL:
- PASS.

Authenticated Shopee browser session:
- PASS.

Real Shopee pdp/get_pc capture:
- PASS.

Real product detail extraction:
- PASS.

## Known Issues

- Windows PowerShell console may display some Vietnamese Unicode characters incorrectly.
- This is currently considered a terminal display issue, not a product data acquisition failure.
- Shopee browser access depends on a valid authenticated session.
- Shopee anti-bot behavior may change over time.

## Currently Working On

V0.1 finalization.

## Next Exact Step

V0.2 - Shopee Search.

Given the source product:

1. Generate a useful search query from the source product.
2. Search Shopee Vietnam.
3. Capture search result data.
4. Return candidate listings including:
   - item_id
   - shop_id
   - title
   - price
   - image
   - sold count
   - rating
   - seller location

Do not implement product matching yet.

First prove that authenticated Shopee search results can be captured reliably.
