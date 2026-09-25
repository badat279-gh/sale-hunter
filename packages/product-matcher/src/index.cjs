const STOP_WORDS = new Set([
  "tui",
  "deo",
  "cheo",
  "da",
  "nam",
  "nu",
  "thoi",
  "trang",
  "cao",
  "cap",
  "chinh",
  "hang",
  "san",
  "pham",
  "viet",
  "mau",
  "dep",
]);

function normalizeText(input = "") {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input = "") {
  return normalizeText(input)
    .split(" ")
    .filter(Boolean);
}

function usefulTokens(input = "") {
  return tokenize(input).filter(
    (token) =>
      token.length >= 2 &&
      !STOP_WORDS.has(token)
  );
}

function jaccardSimilarity(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);

  if (!a.size || !b.size) return 0;

  const intersection = [...a]
    .filter((token) => b.has(token))
    .length;

  const union = new Set([
    ...a,
    ...b,
  ]).size;

  return intersection / union;
}

function extractModelPhrase(title = "") {
  const segments = title
    .split(/\s*[-–—|]\s*/)
    .map((part) => normalizeText(part))
    .filter(Boolean);

  const candidates = segments
    .filter((segment) => {
      const words = segment
        .split(/\s+/)
        .filter(Boolean);

      if (words.length < 1 || words.length > 5) {
        return false;
      }

      const genericCount = words.filter(
        (word) => STOP_WORDS.has(word)
      ).length;

      return genericCount < words.length;
    })
    .map((segment) => ({
      segment,
      score:
        (/\bbag\b/.test(segment) ? 5 : 0) +
        (/\bmini\b/.test(segment) ? 2 : 0) +
        Math.min(segment.split(/\s+/).length, 4),
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.segment || null;
}

function sameModelPhrase(a, b) {
  if (!a || !b) return null;

  if (a === b) return true;

  const aTokens = usefulTokens(a);
  const bTokens = usefulTokens(b);

  if (!aTokens.length || !bTokens.length) {
    return null;
  }

  const similarity =
    jaccardSimilarity(
      aTokens,
      bTokens
    );

  return similarity >= 0.75;
}

function matchProduct(source, candidate) {
  const sourceTitle =
    normalizeText(source?.title || "");

  const candidateTitle =
    normalizeText(candidate?.title || "");

  const sourceTokens =
    usefulTokens(sourceTitle);

  const candidateTokens =
    usefulTokens(candidateTitle);

  let score = 0;
  const reasons = [];

  const similarity =
    jaccardSimilarity(
      sourceTokens,
      candidateTokens
    );

  score += Math.round(
    similarity * 35
  );

  if (similarity >= 0.6) {
    reasons.push(
      "Tiêu đề có độ tương đồng cao"
    );
  }

  const sourceModel =
    extractModelPhrase(
      source?.title || ""
    );

  const candidateModel =
    extractModelPhrase(
      candidate?.title || ""
    );

  const modelMatch =
    sameModelPhrase(
      sourceModel,
      candidateModel
    );

  if (
    sourceModel &&
    candidateModel &&
    modelMatch === true
  ) {
    score += 45;

    reasons.push(
      `Trùng model: ${sourceModel}`
    );
  }

  if (
    sourceModel &&
    candidateModel &&
    modelMatch === false
  ) {
    score -= 60;

    reasons.push(
      `Khác model: ${sourceModel} <> ${candidateModel}`
    );
  }

  const sourceShop =
    normalizeText(
      source?.shop_name || ""
    );

  const candidateShop =
    normalizeText(
      candidate?.shop_name || ""
    );

  if (
    sourceShop &&
    candidateShop &&
    (
      candidateShop.includes(sourceShop) ||
      sourceShop.includes(candidateShop)
    )
  ) {
    score += 15;
    reasons.push("Trùng shop/brand");
  }

  score = Math.max(
    0,
    Math.min(100, score)
  );

  let level = "low";

  if (score >= 75) {
    level = "high";
  } else if (score >= 50) {
    level = "medium";
  }

  return {
    score,
    level,
    similarity:
      Number(similarity.toFixed(3)),
    source_model:
      sourceModel,
    candidate_model:
      candidateModel,
    model_match:
      modelMatch,
    reasons,
  };
}

module.exports = {
  normalizeText,
  extractModelPhrase,
  matchProduct,
};
