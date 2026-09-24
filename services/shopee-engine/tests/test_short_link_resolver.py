import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

from short_link_resolver import resolve_short_url


class FakeResponse:
    def __init__(self, final_url):
        self.final_url = final_url

    def geturl(self):
        return self.final_url

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class ShopeeShortLinkResolverTests(unittest.TestCase):

    def test_full_url_passes_through(self):
        result = resolve_short_url(
            "https://shopee.vn/Test-i.123.456"
        )

        self.assertEqual(result.shop_id, 123)
        self.assertEqual(result.item_id, 456)
        self.assertFalse(result.is_short_url)

    @patch("short_link_resolver.urllib.request.urlopen")
    def test_short_url_resolves_to_product(self, mocked_urlopen):
        mocked_urlopen.return_value = FakeResponse(
            "https://shopee.vn/Example-Product-i.111222333.444555666"
        )

        result = resolve_short_url(
            "https://s.shopee.vn/abc123"
        )

        self.assertEqual(result.original_url, "https://s.shopee.vn/abc123")
        self.assertEqual(result.shop_id, 111222333)
        self.assertEqual(result.item_id, 444555666)
        self.assertEqual(
            result.canonical_url,
            "https://shopee.vn/product/111222333/444555666",
        )


if __name__ == "__main__":
    unittest.main()
