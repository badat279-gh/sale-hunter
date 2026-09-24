from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse


SUPPORTED_HOSTS = {
    "shopee.vn",
    "www.shopee.vn",
    "s.shopee.vn",
    "vn.shp.ee",
}


@dataclass(frozen=True)
class ShopeeProductRef:
    original_url: str
    canonical_url: str | None
    shop_id: int | None
    item_id: int | None
    host: str
    is_short_url: bool


class ShopeeUrlError(ValueError):
    pass


def _normalize_input_url(url: str) -> str:
    value = url.strip()

    if not value:
        raise ShopeeUrlError("Shopee URL is empty.")

    if not value.startswith(("http://", "https://")):
        value = "https://" + value

    return value


def _extract_ids(path: str) -> tuple[int | None, int | None]:
    patterns = [
        r"-i\.(\d+)\.(\d+)",
        r"/product/(\d+)/(\d+)",
        r"/opaanlp/(\d+)/(\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, path, flags=re.IGNORECASE)
        if match:
            return int(match.group(1)), int(match.group(2))

    return None, None


def parse_shopee_url(url: str) -> ShopeeProductRef:
    normalized = _normalize_input_url(url)
    parsed = urlparse(normalized)

    host = parsed.netloc.lower()

    if host not in SUPPORTED_HOSTS:
        raise ShopeeUrlError(
            f"Unsupported host: {host}. Expected a Shopee Vietnam URL."
        )

    is_short_url = host in {"s.shopee.vn", "vn.shp.ee"}

    if is_short_url:
        return ShopeeProductRef(
            original_url=url,
            canonical_url=None,
            shop_id=None,
            item_id=None,
            host=host,
            is_short_url=True,
        )

    shop_id, item_id = _extract_ids(parsed.path)

    if shop_id is None or item_id is None:
        raise ShopeeUrlError(
            "Could not extract shop_id and item_id from Shopee URL."
        )

    canonical_url = f"https://shopee.vn/product/{shop_id}/{item_id}"

    return ShopeeProductRef(
        original_url=url,
        canonical_url=canonical_url,
        shop_id=shop_id,
        item_id=item_id,
        host=host,
        is_short_url=False,
    )
