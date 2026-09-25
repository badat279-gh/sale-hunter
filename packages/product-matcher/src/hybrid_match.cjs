const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { matchProduct } = require("./index.cjs");
const {
  categoryMatches,
} = require("./category_filter.cjs");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error(
    "Usage: node hybrid_match.cjs <payload.json>"
  );
  process.exit(1);
}

const payload = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

const sourceProduct =
  payload?.sourceProduct || null;

const allCandidates =
  Array.isArray(payload?.candidates)
    ? payload.candidates
    : [];

if (
  !sourceProduct ||
  !sourceProduct.title ||
  !sourceProduct.image
) {
  console.error(
    "Payload must contain sourceProduct.title and sourceProduct.image"
  );
  process.exit(2);
}

const categoryFiltered =
  allCandidates.filter(
    (candidate) =>
      categoryMatches(
        sourceProduct,
        candidate
      )
  );

const imageMatcher = path.resolve(
  __dirname,
  "..",
  "image",
  "image_match.py"
);

const textRanked =
  categoryFiltered
    .map((candidate) => {
      const match = matchProduct(
        sourceProduct,
        candidate
      );

      return {
        ...candidate,

        text_score:
          match.score,

        text_level:
          match.level,

        text_similarity:
          match.similarity,

        source_model:
          match.source_model,

        candidate_model:
          match.candidate_model,

        model_match:
          match.model_match,

        text_reasons:
          match.reasons,
      };
    })
    .sort(
      (a, b) =>
        b.text_score -
        a.text_score
    );

const shortlist =
  textRanked
    .filter(
      (item) => item.image
    )
    .slice(0, 30);

const results = [];

for (const candidate of shortlist) {
  let imageSimilarity = null;
  let imageDistance = null;

  try {
    const output = execFileSync(
      "python",
      [
        imageMatcher,
        sourceProduct.image,
        candidate.image,
      ],
      {
        encoding: "utf8",
        timeout: 30000,
        maxBuffer:
          1024 * 1024,
      }
    );

    const imageResult =
      JSON.parse(
        output.trim()
      );

    if (imageResult.ok) {
      imageSimilarity =
        imageResult.image_similarity;

      imageDistance =
        imageResult.hash_distance;
    }
  } catch {
    // Image failure does not kill the batch.
  }

  const modelConflict =
    candidate.model_match === false;

  const imageScore =
    typeof imageSimilarity ===
    "number"
      ? imageSimilarity * 100
      : 0;

  let finalScore =
    Math.round(
      candidate.text_score * 0.6 +
      imageScore * 0.4
    );

  let status = "rejected";

  if (modelConflict) {
    finalScore =
      Math.min(
        finalScore,
        35
      );

    status = "rejected";
  } else if (
    finalScore >= 80 &&
    imageSimilarity >= 0.8
  ) {
    status = "confirmed";
  } else if (
    finalScore >= 68 &&
    candidate.model_match !== false
  ) {
    status = "possible";
  }

  results.push({
    item_id:
      candidate.item_id,

    shop_id:
      candidate.shop_id,

    title:
      candidate.title,

    shop_name:
      candidate.shop_name,

    price:
      candidate.price,

    image:
      candidate.image,

    category_id:
      candidate.category_id,

    text_score:
      candidate.text_score,

    image_similarity:
      imageSimilarity,

    image_distance:
      imageDistance,

    source_model:
      candidate.source_model,

    candidate_model:
      candidate.candidate_model,

    model_match:
      candidate.model_match,

    final_score:
      finalScore,

    status,

    model_conflict:
      modelConflict,

    product_url:
      candidate.product_url,
  });

  console.error(
    `[${results.length}/${shortlist.length}] ` +
      `${finalScore} ${status} | ` +
      candidate.title
  );
}

results.sort(
  (a, b) =>
    b.final_score -
    a.final_score
);

const summary = {
  scanned_candidates:
    allCandidates.length,

  category_matched:
    categoryFiltered.length,

  text_checked:
    textRanked.length,

  image_checked:
    results.length,

  confirmed:
    results.filter(
      (x) =>
        x.status ===
        "confirmed"
    ).length,

  possible:
    results.filter(
      (x) =>
        x.status ===
        "possible"
    ).length,

  rejected:
    results.filter(
      (x) =>
        x.status ===
        "rejected"
    ).length,
};

console.log(
  JSON.stringify(
    {
      ok: true,
      source_product:
        sourceProduct,
      summary,
      results,
    },
    null,
    2
  )
);
