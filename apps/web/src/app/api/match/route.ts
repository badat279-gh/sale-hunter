import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type SourceProduct = {
  title: string;
  shop_name?: string | null;
  image: string;
  category_id?: number | null;
  global_category_id?: unknown;
};

type PipelineResult = {
  ok: boolean;
  source_product?: SourceProduct;
  summary?: {
    queries?: string[];
    pages?: number[];
    collected?: number;
    unique_candidates?: number;
    category_matched?: number;
    text_checked?: number;
    image_checked?: number;
    confirmed?: number;
    possible?: number;
    rejected?: number;
  };
  results?: Array<{
    item_id: number;
    shop_id: number;
    title: string;
    shop_name?: string | null;
    price?: number | null;
    image?: string | null;
    product_url?: string;
    final_score: number;
    status: "confirmed" | "possible" | "rejected";
    source_model?: string | null;
    candidate_model?: string | null;
    model_match?: boolean | null;
    image_similarity?: number | null;
  }>;
};

export async function POST(request: Request) {
  let tempFile: string | null = null;

  try {
    const body = await request.json();

    const sourceProduct =
      body?.sourceProduct &&
      typeof body.sourceProduct === "object"
        ? body.sourceProduct
        : null;

    if (
      !sourceProduct?.title ||
      !sourceProduct?.image
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Thiếu thông tin sản phẩm nguồn để đối chiếu.",
        },
        { status: 400 }
      );
    }

    const repoRoot = path.resolve(
      process.cwd(),
      "..",
      ".."
    );

    const pipelinePath = path.join(
      repoRoot,
      "packages",
      "product-matcher",
      "src",
      "pipeline.cjs"
    );

    tempFile = path.join(
      os.tmpdir(),
      `sale-hunter-pipeline-${crypto.randomUUID()}.json`
    );

    await writeFile(
      tempFile,
      JSON.stringify({
        sourceProduct,
      }),
      "utf8"
    );

    const {
      stdout,
      stderr,
    } = await execFileAsync(
      "node",
      [
        pipelinePath,
        tempFile,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 10 * 60 * 1000,
        windowsHide: false,
        maxBuffer:
          30 * 1024 * 1024,
        env: {
          ...process.env,
          SHOPEE_DOMAIN:
            "shopee.vn",
        },
      }
    );

    if (stderr?.trim()) {
      console.log(
        "PRODUCT_MATCH_PIPELINE_LOG",
        stderr
      );
    }

    const result =
      JSON.parse(
        stdout.trim()
      ) as PipelineResult;

    const results =
      Array.isArray(result.results)
        ? result.results
        : [];

    const confirmed =
      results.filter(
        (item) =>
          item.status ===
          "confirmed"
      );

    const possible =
      results.filter(
        (item) =>
          item.status ===
          "possible"
      );

    return NextResponse.json({
      ok: true,
      source_product:
        result.source_product,
      summary:
        result.summary,
      confirmed,
      possible,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "SALE_HUNTER_MATCH_ERROR",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Không thể hoàn tất đối chiếu sản phẩm lúc này.",
        detail: message,
      },
      { status: 500 }
    );
  } finally {
    if (tempFile) {
      await unlink(
        tempFile
      ).catch(() => {});
    }
  }
}
