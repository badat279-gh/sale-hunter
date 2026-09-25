const fs = require("node:fs");
const path = require("node:path");
const {
  execFileSync,
} = require("node:child_process");

const {
  matchProduct,
  extractModelPhrase,
} = require("./index.cjs");

const {
  categoryMatches,
} = require("./category_filter.cjs");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error(
    "Usage: node pipeline.cjs <payload.json>"
  );
  process.exit(1);
}

const payload = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

const sourceProduct =
  payload?.sourceProduct || null;

if (
  !sourceProduct?.title ||
  !sourceProduct?.image
) {
  console.error(
    "sourceProduct.title and sourceProduct.image are required"
  );
  process.exit(2);
}

const workerDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "workers",
  "browser"
);

const searchProbe = path.join(
  workerDir,
  "src",
  "search_probe.mjs"
);

const imageMatcher = path.resolve(
  __dirname,
  "..",
  "image",
  "image_match.py"
);

function normalizeSpace(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values) {
  return [
    ...new Set(
      values
        .map(normalizeSpace)
        .filter(Boolean)
    ),
  ];
}

function buildQueries(product) {
  const model =
    extractModelPhrase(
      product.title || ""
    );

  const shop =
    normalizeSpace(
      product.shop_name || ""
    );

  const queries = [];

  if (model) {
    queries.push(model);

    if (shop) {
      queries.push(
        `${model} ${shop}`
      );

      const firstModelToken =
        model
          .split(/\s+/)
          .filter(Boolean)[0];

      if (firstModelToken) {
        queries.push(
          `${firstModelToken} ${shop}`
        );
      }

      queries.push(
        `${shop} ${model}`
      );
    }
  }

  if (!queries.length) {
    queries.push(
      product.title
    );
  }

  return uniqueStrings(
    queries
  ).slice(0, 4);
}

function readSearchResult(output) {
  const marker =
    output.lastIndexOf(
      '{\n  "ok"'
    );

  if (marker === -1) {
    return null;
  }

  try {
    return JSON.parse(
      output
        .slice(marker)
        .trim()
    );
  } catch {
    return null;
  }
}

const queries =
  buildQueries(
    sourceProduct
  );

const pages = [0, 1, 2];
const collected = [];

for (const query of queries) {
  for (const page of pages) {
    console.error(
      `SEARCH "${query}" page=${page}`
    );

    try {
      const output =
        execFileSync(
          "node",
          [
            searchProbe,
            query,
            String(page),
          ],
          {
            cwd: workerDir,
            encoding: "utf8",
            timeout: 90000,
            maxBuffer:
              30 * 1024 * 1024,
            env: {
              ...process.env,
              SHOPEE_DOMAIN:
                "shopee.vn",
            },
          }
        );

      const search =
        readSearchResult(
          output
        );

      if (!search?.ok) {
        continue;
      }

      for (
        const candidate of
        search.results || []
      ) {
        collected.push({
          ...candidate,
          search_query: query,
          search_page: page,
        });
      }
    } catch (error) {
      console.error(
        `SEARCH FAILED "${query}" page=${page}`
      );
    }
  }
}

const uniqueCandidates =
  Array.from(
    new Map(
      collected.map(
        (candidate) => [
          `${candidate.shop_id}:${candidate.item_id}`,
          candidate,
        ]
      )
    ).values()
  );

const categoryFiltered =
  uniqueCandidates.filter(
    (candidate) =>
      categoryMatches(
        sourceProduct,
        candidate
      )
  );

const textRanked =
  categoryFiltered
    .map((candidate) => {
      const match =
        matchProduct(
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
      (item) =>
        item.image
    )
    .slice(0, 30);

const results = [];

for (
  let index = 0;
  index < shortlist.length;
  index++
) {
  const candidate =
    shortlist[index];

  let imageSimilarity = null;
  let imageDistance = null;

  try {
    const output =
      execFileSync(
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
    // Continue without image signal.
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
      candidate.text_score *
        0.6 +
      imageScore *
        0.4
    );

  let status =
    "rejected";

  if (modelConflict) {
    finalScore =
      Math.min(
        finalScore,
        35
      );
  } else if (
    finalScore >= 80 &&
    imageSimilarity >= 0.8
  ) {
    status =
      "confirmed";
  } else if (
    finalScore >= 68
  ) {
    status =
      "possible";
  }

  results.push({
    ...candidate,

    image_similarity:
      imageSimilarity,

    image_distance:
      imageDistance,

    final_score:
      finalScore,

    status,

    model_conflict:
      modelConflict,
  });

  console.error(
    `MATCH ${index + 1}/${shortlist.length} ` +
    `${finalScore} ${status}`
  );
}

results.sort(
  (a, b) =>
    b.final_score -
    a.final_score
);

const summary = {
  queries,
  pages,

  collected:
    collected.length,

  unique_candidates:
    uniqueCandidates.length,

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
