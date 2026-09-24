from __future__ import annotations

import json
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent
sys.path.insert(0, str(SRC))

from short_link_resolver import resolve_short_url
from url_resolver import ShopeeUrlError


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage:")
        print('python services/shopee-engine/src/resolve_cli.py "<SHOPEE_URL>"')
        return 1

    url = sys.argv[1]

    try:
        result = resolve_short_url(url)
    except ShopeeUrlError as exc:
        print(f"ERROR: {exc}")
        return 2

    print(
        json.dumps(
            {
                "original_url": result.original_url,
                "canonical_url": result.canonical_url,
                "shop_id": result.shop_id,
                "item_id": result.item_id,
                "host": result.host,
                "is_short_url": result.is_short_url,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
