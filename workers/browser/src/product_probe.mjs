import os from "node:os";
import path from "node:path";
import { launchPersistentContext } from "cloakbrowser";

const DOMAIN = process.env.SHOPEE_DOMAIN || "shopee.vn";
const PROFILE_DIR =
  process.env.SHOPEE_PROFILE_DIR ||
  path.join(os.homedir(), ".sale-hunter", "shopee-profile");

const shopId = process.argv[2];
const itemId = process.argv[3];

if (!shopId || !itemId || !/^\d+$/.test(shopId) || !/^\d+$/.test(itemId)) {
  console.error("Usage:");
  console.error("npm run probe -- <shop_id> <item_id>");
  process.exit(1);
}

const productUrl = `https://${DOMAIN}/product/${shopId}/${itemId}`;

const context = await launchPersistentContext({
  userDataDir: PROFILE_DIR,
  headless: false,
  locale: "vi-VN",
  timezone: "Asia/Ho_Chi_Minh",
  viewport: { width: 1366, height: 768 },
  humanize: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page =
    context.pages().find((p) => !p.isClosed()) ||
    (await context.newPage());

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v4/") &&
      response.url().includes("pdp/get_pc"),
    { timeout: 45000 }
  );

  await page.goto(productUrl, {
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
    const data = json?.data || {};
    const item = data?.item || {};
    const priceData = data?.product_price?.price || {};
    const shop = data?.shop_detailed || {};
    const account = data?.account || {};

    const rawPrice =
      priceData.single_value >= 0
        ? priceData.single_value
        : priceData.range_min;

    const price =
      typeof rawPrice === "number" && rawPrice >= 0
        ? rawPrice / 100000
        : null;

    const image = item?.image
      ? `https://down-vn.img.susercontent.com/file/${item.image}`
      : null;

    const shopName =
      shop?.name ??
      shop?.shop_name ??
      shop?.username ??
      account?.username ??
      account?.name ??
      null;

    console.log(
      JSON.stringify(
        {
          ok: true,
          product_url: productUrl,
          shop_id: item?.shop_id ?? Number(shopId),
          item_id: item?.item_id ?? Number(itemId),
          title: item?.title ?? null,
          price,
          currency: item?.currency ?? "VND",
          image,
          shop_name: shopName,
          shop_location: item?.shop_location ?? null,
        },
        null,
        2
      )
    );
  }
} catch (error) {
  console.error("");
  console.error("PRODUCT PROBE FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  console.error("Neu session het han, chay: npm run login");
  process.exitCode = 3;
} finally {
  await context.close();
}
