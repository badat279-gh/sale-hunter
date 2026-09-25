import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {
  writeFile,
  unlink,
} from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type Candidate = {
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
};

type SearchResult = {
  ok: boolean;
  query?: string;
  total_count?: number | null;
  raw_items_count?: number;
  normalized_count?: number;
  unique_count?: number;
  returned_count?: number;
  results?: Candidate[];
  error?: number | string;
  error_msg?: string | null;
};

type MatcherResult = {
  ok: boolean;
  summary: {
    high: number;
    medium: number;
    low: number;
  };
  results: Array<
    Candidate & {
      match_score: number;
      match_level: "high" | "medium" | "low";
      match_similarity: number;
      match_reasons: string[];
    }
  >;
};

function extractSearchJson(
  output: string
): SearchResult {
  const marker = output.lastIndexOf(
    '{\n  "ok"'
  );

  if (marker === -1) {
    throw new Error(
      `Không tìm thấy JSON từ Shopee search worker.\n${output.slice(-1500)}`
    );
  }

  return JSON.parse(
    output.slice(marker).trim()
  ) as SearchResult;
}

export async function POST(
  request: Request
) {
  let tempFile: string | null = null;

  try {
    const body = await request.json();

    const query =
      typeof body?.query === "string"
        ? body.query.trim()
        : "";

    const sourceProduct =
      body?.sourceProduct &&
      typeof body.sourceProduct === "object"
        ? body.sourceProduct
        : null;

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          message: "Thiếu từ khóa tìm kiếm.",
        },
        { status: 400 }
      );
    }

    const repoRoot = path.resolve(
      process.cwd(),
      "..",
      ".."
    );

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

    const {
      stdout: searchStdout,
      stderr: searchStderr,
    } = await execFileAsync(
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

    const searchResult =
      extractSearchJson(
        `${searchStdout}\n${searchStderr ?? ""}`
      );

    if (!searchResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            searchResult.error === 90309999
              ? "Phiên Shopee đã hết hạn hoặc bị Shopee từ chối."
              : "Shopee Search chưa trả được dữ liệu.",
          detail: searchResult,
        },
        { status: 502 }
      );
    }

    if (!sourceProduct) {
      return NextResponse.json({
        ...searchResult,
        marketplace: "Shopee",
      });
    }

    const matcherCli = path.join(
      repoRoot,
      "packages",
      "product-matcher",
      "src",
      "match_batch.cjs"
    );

    tempFile = path.join(
      os.tmpdir(),
      `sale-hunter-match-${crypto.randomUUID()}.json`
    );

    await writeFile(
      tempFile,
      JSON.stringify({
        sourceProduct,
        candidates:
          searchResult.results ?? [],
      }),
      "utf8"
    );

    const {
      stdout: matcherStdout,
      stderr: matcherStderr,
    } = await execFileAsync(
      "node",
      [matcherCli, tempFile],
      {
        cwd: path.dirname(matcherCli),
        encoding: "utf8",
        timeout: 30000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (matcherStderr?.trim()) {
      console.error(
        "PRODUCT_MATCHER_STDERR",
        matcherStderr
      );
    }

    const matcherResult =
      JSON.parse(
        matcherStdout.trim()
      ) as MatcherResult;

    return NextResponse.json({
      ...searchResult,
      marketplace: "Shopee",
      results: matcherResult.results,
      match_summary:
        matcherResult.summary,
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
        message:
          "Không thể tìm sản phẩm Shopee lúc này.",
        detail: message,
      },
      { status: 500 }
    );
  } finally {
    if (tempFile) {
      await unlink(tempFile).catch(
        () => {}
      );
    }
  }
}
