const STOP_PHRASES = [
  "túi đeo chéo",
  "tui deo cheo",
  "da nam nữ",
  "da nam nu",
  "thời trang",
  "thoi trang",
  "việt nam",
  "viet nam",
  "chính hãng",
  "chinh hang",
  "cao cấp",
  "cao cap",
];

function normalize(input = "") {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSegment(input = "") {
  let text = normalize(input);

  for (const phrase of STOP_PHRASES) {
    const normalizedPhrase = normalize(phrase);

    text = text.replace(
      new RegExp(
        `\\b${normalizedPhrase.replace(/\s+/g, "\\s+")}\\b`,
        "gi"
      ),
      " "
    );
  }

  return text
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—]+|[\s\-–—]+$/g, "")
    .trim();
}

function buildSearchQuery(product = {}) {
  const title = product?.title || "";
  const shopName = product?.shop_name || "";

  const segments = title
    .split(/\s*[-–—|]\s*/)
    .map((part) => cleanSegment(part))
    .filter(Boolean);

  const useful = segments.filter((segment) => {
    const words = segment.split(/\s+/).filter(Boolean);

    return (
      words.length >= 2 &&
      segment.length >= 5
    );
  });

  let core =
    useful.find((segment) =>
      /\bbag\b/i.test(segment)
    ) ||
    useful[0] ||
    cleanSegment(title);

  const shop = cleanSegment(shopName);

  if (
    shop &&
    !normalize(core)
      .toLowerCase()
      .includes(normalize(shop).toLowerCase())
  ) {
    core = `${core} ${shop}`;
  }

  return core
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  buildSearchQuery,
};
