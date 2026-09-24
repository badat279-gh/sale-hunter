import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { launchPersistentContext } from "cloakbrowser";

const DOMAIN = process.env.SHOPEE_DOMAIN || "shopee.vn";
const PROFILE_DIR =
  process.env.SHOPEE_PROFILE_DIR ||
  path.join(os.homedir(), ".sale-hunter", "shopee-profile");

console.log("SALE HUNTER - SHOPEE LOGIN");
console.log(`Domain: ${DOMAIN}`);
console.log(`Profile: ${PROFILE_DIR}`);
console.log("");

const context = await launchPersistentContext({
  userDataDir: PROFILE_DIR,
  headless: false,
  locale: "vi-VN",
  timezone: "Asia/Ho_Chi_Minh",
  viewport: { width: 1366, height: 768 },
  humanize: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page =
  context.pages().find((p) => !p.isClosed()) ||
  (await context.newPage());

await page.goto(`https://${DOMAIN}/`, {
  waitUntil: "domcontentloaded",
  timeout: 45000,
});

console.log("");
console.log("1. Dang nhap Shopee tren cua so vua mo.");
console.log("2. Khi thay trang Shopee da dang nhap thanh cong, quay lai PowerShell.");
console.log("3. Nhan ENTER de luu session va dong browser.");
console.log("");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

await new Promise((resolve) => {
  rl.question("Nhan ENTER sau khi dang nhap xong...", () => resolve());
});

rl.close();
await context.close();

console.log("");
console.log("Session da duoc luu.");
