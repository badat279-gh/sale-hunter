# SALE HUNTER - AGENTS.md

## PROJECT
Sale Hunter is a Shopee-first price hunting and comparison application.

Primary marketplace:
- Shopee Vietnam

Secondary marketplace:
- TikTok Shop Vietnam

Main goal:
User pastes a Shopee or TikTok Shop product URL.
The system identifies the exact product, finds equivalent listings, calculates the real payable price, and returns the cheapest valid option.

## DEVELOPMENT PRINCIPLES

1. GitHub is the source of truth.
2. Never guess project state from previous chat memory.
3. Before modifying code, always read:
   - AGENTS.md
   - docs/PROJECT_STATE.md
   - docs/ROADMAP.md
   - latest Git branch
   - latest Git commit
4. Work on one clearly defined feature at a time.
5. Do not rewrite working modules unnecessarily.
6. Preserve stable functionality while adding new features.
7. Test each module before moving to the next module.
8. Do not claim PASS unless the test was actually executed.
9. Update PROJECT_STATE.md whenever a feature reaches a meaningful milestone.
10. Commit meaningful milestones to GitHub.

## DEVELOPMENT WORKFLOW

SCAN
→ PLAN
→ PATCH
→ TEST
→ VERIFY
→ USER APPROVAL
→ UPDATE PROJECT STATE
→ COMMIT
→ PUSH

## BUILD POLICY

Use:

CODE
→ TEST
→ PATCH
→ TEST
→ FREEZE VERSION
→ BUILD ONLY WHEN REQUIRED

Do not perform full builds after every small code change.

## CORE ARCHITECTURE

Frontend:
- React / Next.js

Backend:
- Python
- FastAPI

Browser automation:
- Playwright

Database:
- PostgreSQL

Queue / cache:
- Redis

Optional local AI:
- Ollama
- Local embedding models
- Image similarity models

## MARKETPLACE ARCHITECTURE

MarketplaceAdapter
├── ShopeeAdapter
└── TikTokShopAdapter

Common operations should eventually include:

- resolve_url()
- get_product()
- search_products()
- get_variants()
- get_price()
- get_promotions()
- get_shipping()
- calculate_final_price()

## PRIORITY

Shopee: 80%
TikTok Shop: 20%

Shopee must be working reliably before significant TikTok Shop development begins.

## MVP RULE

Do not build advanced AI, price alerts, affiliate features, or complex UI before the basic Shopee pipeline works.

Initial pipeline:

Paste Shopee URL
→ Resolve product
→ Read product information
→ Search equivalent listings
→ Match equivalent products
→ Rank by price

Then add:

Voucher
→ Shipping
→ Final payable price

Then add TikTok Shop.
