import os from "node:os";
import path from "node:path";
import { launchPersistentContext } from "cloakbrowser";

const DOMAIN = process.env.SHOPEE_DOMAIN || "shopee.vn";
const PROFILE_DIR =
  process.env.SHOPEE_PROFILE_DIR ||
  path.join(os.homedir(), ".sale-hunter", "shopee-profile");

const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error('Usage: npm run search-probe -- "tu khoa"');
  process.exit(1);
}

const searchUrl =
  `https://${DOMAIN}/search?keyword=${encodeURIComponent(query)}` +
  `&page=0&sortBy=relevancy`;

const context = await launchPersistentContext({
  userDataDir: PROFILE_DIR,
  headless: false,
  locale: "vi-VN",
  timezone: "Asia/Ho_Chi_Minh",
  viewport: { width: 1366, height: 768 },
  humanize: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

function price(raw) {
  return typeof raw === "number" ? raw / 100000 : null;
}

function imageUrl(hash) {
  return hash
    ? `https://down-vn.img.susercontent.com/file/${hash}`
    : null;
}

function normalizeItem(entry) {
  const data = entry?.item_data;
  const asset = entry?.item_card_displayed_asset;

  if (!data?.itemid || !data?.shopid || !asset?.name) {
    return null;
  }

  const priceInfo = data?.item_card_display_price || {};
  const soldInfo = data?.item_card_display_sold_count || {};

  return {
    item_id: data.itemid,
    shop_id: data.shopid,

    title: asset.name,

    price: price(
      priceInfo.price ??
      asset?.display_price?.price
    ),

    original_price: price(
      priceInfo.original_price ??
      priceInfo.strikethrough_price ??
      asset?.display_price?.strikethrough_price
    ),

    discount:
      priceInfo.discount ??
      asset?.discount_tag?.discount_text ??
      null,

    currency: "VND",

    image: imageUrl(asset.image),

    shop_name:
      data?.shop_data?.shop_name ??
      null,

    shop_location:
      asset?.shop_location ??
      null,

    sold:
      soldInfo?.historical_sold_count ??
      soldInfo?.monthly_sold_count ??
      0,

    monthly_sold:
      soldInfo?.monthly_sold_count ??
      0,

    rating:
      data?.item_rating?.rating_star ??
      null,

    verified:
      Boolean(data?.shopee_verified),

    is_sold_out:
      Boolean(data?.is_sold_out),

    product_url:
      `https://${DOMAIN}/product/${data.shopid}/${data.itemid}`,
  };
}

try {
  const page =
    context.pages().find((p) => !p.isClosed()) ||
    (await context.newPage());

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v4/") &&
      response.url().includes("search/search_items"),
    { timeout: 45000 }
  );

  await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  const response = await responsePromise;
  const json = await response.json();

  if (json?.error && json.error !== 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: json.error,
          error_msg: json.error_msg || null,
        },
        null,
        2
      )
    );

    process.exitCode = 2;
  } else {
    const rawItems = Array.isArray(json?.items) ? json.items : [];

    const normalized = rawItems
      .map(normalizeItem)
      .filter(Boolean);

    const unique = Array.from(
      new Map(
        normalized.map((item) => [
          `${item.shop_id}:${item.item_id}`,
          item,
        ])
      ).values()
    );

    const results = unique.slice(0, 30);

    console.log(
      JSON.stringify(
        {
          ok: true,
          query,
          total_count: json?.total_count ?? null,
          raw_items_count: rawItems.length,
          normalized_count: normalized.length,
          unique_count: unique.length,
          returned_count: results.length,
          results,
        },
        null,
        2
      )
    );
  }
} catch (error) {
  console.error("");
  console.error("SEARCH PROBE FAILED");
  console.error(
    error instanceof Error ? error.message : String(error)
  );

  process.exitCode = 3;
} finally {
  await context.close();
}
