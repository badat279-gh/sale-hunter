import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type SearchResult = {
  ok: boolean;
  query?: string;
  total_count?: number | null;
  raw_items_count?: number;
  normalized_count?: number;
  unique_count?: number;
  returned_count?: number;
  results?: Array<{
    item_id: number;
    shop_id: number;
    title: string;
    price: number | null;
    original_price: number | null;
    discount: number | string | null;
    currency: string;
    image: string | null;
    shop_name: string | null;
    shop_location: string | null;
    sold: number;
    monthly_sold: number;
    rating: number | null;
    verified: boolean;
    is_sold_out: boolean;
    product_url: string;
  }>;
  error?: number | string;
  error_msg?: string | null;
};

function extractJson(output: string): SearchResult {
  const marker = output.lastIndexOf('{\n  "ok"');

  if (marker === -1) {
    throw new Error(
      `Không tìm thấy JSON từ Shopee search worker.\n${output.slice(-1500)}`
    );
  }

  return JSON.parse(output.slice(marker).trim()) as SearchResult;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query =
      typeof body?.query === "string"
        ? body.query.trim()
        : "";

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          message: "Thiếu từ khóa tìm kiếm.",
        },
        { status: 400 }
      );
    }

    const repoRoot = path.resolve(process.cwd(), "..", "..");

    const workerDir = path.join(
      repoRoot,
      "workers",
      "browser"
    );

    const searchProbe = path.join(
      workerDir,
      "src",
      "search_probe.mjs"
    );

    const { stdout, stderr } = await execFileAsync(
      "node",
      [searchProbe, query],
      {
        cwd: workerDir,
        encoding: "utf8",
        timeout: 90000,
        windowsHide: false,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          SHOPEE_DOMAIN: "shopee.vn",
        },
      }
    );

    const result = extractJson(
      `${stdout}\n${stderr ?? ""}`
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            result.error === 90309999
              ? "Phiên Shopee đã hết hạn hoặc bị Shopee từ chối."
              : "Shopee Search chưa trả được dữ liệu.",
          detail: result,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...result,
      marketplace: "Shopee",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "SALE_HUNTER_SEARCH_ERROR",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Không thể tìm sản phẩm Shopee lúc này.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
