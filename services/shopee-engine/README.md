# Shopee Engine

Core Shopee Vietnam integration for Sale Hunter.

## V0.1

Current scope:

- Validate Shopee Vietnam URLs
- Parse standard product URLs
- Extract shop_id
- Extract item_id
- Produce canonical URL
- Detect Shopee short URLs

Short-link redirect resolution will be implemented separately.

## Run tests

From repository root:

python -m unittest discover services/shopee-engine/tests -v
