const fs = require("node:fs");
const {
  matchProduct,
} = require("./index.cjs");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Missing input file.");
  process.exit(1);
}

try {
  const payload = JSON.parse(
    fs.readFileSync(inputPath, "utf8")
  );

  const sourceProduct = payload.sourceProduct || {};
  const candidates = Array.isArray(payload.candidates)
    ? payload.candidates
    : [];

  const results = candidates
    .map((candidate) => {
      const match = matchProduct(
        sourceProduct,
        candidate
      );

      return {
        ...candidate,
        match_score: match.score,
        match_level: match.level,
        match_similarity: match.similarity,
        match_reasons: match.reasons,
      };
    })
    .sort(
      (a, b) =>
        b.match_score - a.match_score
    );

  const summary = {
    high: results.filter(
      (item) => item.match_level === "high"
    ).length,

    medium: results.filter(
      (item) => item.match_level === "medium"
    ).length,

    low: results.filter(
      (item) => item.match_level === "low"
    ).length,
  };

  console.log(
    JSON.stringify({
      ok: true,
      summary,
      results,
    })
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.stack || error.message
      : String(error)
  );

  process.exit(2);
}
