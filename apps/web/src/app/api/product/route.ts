import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type ResolveResult = {
  original_url: string;
  canonical_url: string | null;
  shop_id: number | null;
  item_id: number | null;
  host: string;
  is_short_url: boolean;
};

type ProductResult = {
  ok: boolean;
  product_url?: string;
  shop_id?: number;
  item_id?: number;
  title?: string | null;
  price?: number | null;
  currency?: string | null;
  image?: string | null;
  shop_name?: string | null;
  shop_location?: string | null;
  error?: number | string;
  error_msg?: string | null;
};

function extractJsonObject(output: string): ProductResult {
  const marker = output.lastIndexOf('{\n  "ok"');

  if (marker === -1) {
    throw new Error(
      `Không tìm thấy JSON kết quả từ Shopee worker.\n${output.slice(-1000)}`
    );
  }

  const jsonText = output.slice(marker).trim();
  return JSON.parse(jsonText) as ProductResult;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productUrl =
      typeof body?.productUrl === "string" ? body.productUrl.trim() : "";

    const address =
      typeof body?.address === "string" ? body.address.trim() : "";

    if (!productUrl) {
      return NextResponse.json(
        { ok: false, message: "Vui lòng dán link sản phẩm." },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { ok: false, message: "Vui lòng nhập địa chỉ giao hàng." },
        { status: 400 }
      );
    }

    const repoRoot = path.resolve(process.cwd(), "..", "..");

    const resolverPath = path.join(
      repoRoot,
      "services",
      "shopee-engine",
      "src",
      "resolve_cli.py"
    );

    const { stdout: resolveStdout } = await execFileAsync(
      "python",
      [resolverPath, productUrl],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 30000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }
    );

    const resolved = JSON.parse(resolveStdout) as ResolveResult;

    if (!resolved.shop_id || !resolved.item_id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Không xác định được sản phẩm Shopee từ link này.",
        },
        { status: 400 }
      );
    }

    const probePath = path.join(
      repoRoot,
      "workers",
      "browser",
      "src",
      "product_probe.mjs"
    );

    const { stdout: probeStdout, stderr: probeStderr } =
      await execFileAsync(
        "node",
        [
          probePath,
          String(resolved.shop_id),
          String(resolved.item_id),
        ],
        {
          cwd: path.join(repoRoot, "workers", "browser"),
          encoding: "utf8",
          timeout: 90000,
          windowsHide: false,
          maxBuffer: 5 * 1024 * 1024,
          env: {
            ...process.env,
            SHOPEE_DOMAIN: "shopee.vn",
          },
        }
      );

    const product = extractJsonObject(
      `${probeStdout}\n${probeStderr ?? ""}`
    );

    if (!product.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            product.error === 90309999
              ? "Phiên Shopee đã hết hạn hoặc bị Shopee từ chối. Cần kết nối lại Shopee."
              : "Không đọc được dữ liệu sản phẩm Shopee.",
          detail: product,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      marketplace: "Shopee",
      address,
      source: resolved,
      product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("SALE_HUNTER_PRODUCT_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Không thể đọc sản phẩm lúc này.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
