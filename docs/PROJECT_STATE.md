# PROJECT STATE

## Project
SALE HUNTER

Repository:
badat279-gh/sale-hunter

## Current Status
INITIAL PROJECT SETUP

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

Planned stack:

Frontend:
- Next.js / React

Backend:
- FastAPI / Python

Browser worker:
- Playwright

Database:
- PostgreSQL

Queue/cache:
- Redis

Local AI when required:
- Ollama
- embeddings
- image similarity

## Current Version

V0.0.1 - Project bootstrap

## Completed

- GitHub repository created.
- Initial project directory structure defined.
- Project operating rules documented.
- Initial roadmap created.

## Currently Working On

Project bootstrap and technical validation.

## Tests Passed

None yet.

## Next Exact Step

Research and validate the Shopee data acquisition path.

The first technical experiment must prove that the system can:

1. Accept a Shopee product URL.
2. Resolve the URL.
3. Extract Shopee item_id and shop_id or equivalent identifiers.
4. Retrieve basic product information.

Do not begin frontend development before this experiment is validated.

## Important

No assumptions should be made that Shopee endpoints remain stable.

All Shopee access must be implemented behind a dedicated adapter so it can be replaced without rewriting the rest of the application.
