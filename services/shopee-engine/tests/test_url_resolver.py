import sys
import unittest
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

from url_resolver import ShopeeUrlError, parse_shopee_url


class ShopeeUrlResolverTests(unittest.TestCase):

    def test_i_format(self):
        result = parse_shopee_url(
            "https://shopee.vn/Test-Product-i.123456789.987654321"
        )

        self.assertEqual(result.shop_id, 123456789)
        self.assertEqual(result.item_id, 987654321)
        self.assertEqual(
            result.canonical_url,
            "https://shopee.vn/product/123456789/987654321",
        )
        self.assertFalse(result.is_short_url)

    def test_product_format(self):
        result = parse_shopee_url(
            "https://shopee.vn/product/123456789/987654321"
        )

        self.assertEqual(result.shop_id, 123456789)
        self.assertEqual(result.item_id, 987654321)

    def test_url_without_protocol(self):
        result = parse_shopee_url(
            "shopee.vn/Test-i.111.222"
        )

        self.assertEqual(result.shop_id, 111)
        self.assertEqual(result.item_id, 222)

    def test_short_url_is_detected(self):
        result = parse_shopee_url(
            "https://s.shopee.vn/ABC123"
        )

        self.assertTrue(result.is_short_url)
        self.assertIsNone(result.shop_id)
        self.assertIsNone(result.item_id)

    def test_invalid_domain(self):
        with self.assertRaises(ShopeeUrlError):
            parse_shopee_url(
                "https://example.com/product/123/456"
            )

    def test_invalid_shopee_url(self):
        with self.assertRaises(ShopeeUrlError):
            parse_shopee_url(
                "https://shopee.vn/some-random-page"
            )


if __name__ == "__main__":
    unittest.main()
