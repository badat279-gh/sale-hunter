from __future__ import annotations

import urllib.request
from dataclasses import replace

from url_resolver import ShopeeProductRef, ShopeeUrlError, parse_shopee_url


def resolve_short_url(url: str, timeout: int = 15) -> ShopeeProductRef:
    parsed = parse_shopee_url(url)

    if not parsed.is_short_url:
        return parsed

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            final_url = response.geturl()
    except Exception as exc:
        raise ShopeeUrlError(f"Failed to resolve Shopee short URL: {exc}") from exc

    resolved = parse_shopee_url(final_url)

    return replace(
        resolved,
        original_url=url,
    )
