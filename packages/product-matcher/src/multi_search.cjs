const path = require("node:path");
const { execFileSync } = require("node:child_process");

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

const queries = process.argv.slice(2);

if (!queries.length) {
  console.error("Missing queries.");
  process.exit(1);
}

const pages = [0, 1, 2];
const all = [];

for (const query of queries) {
  for (const page of pages) {
    console.error(`Searching: "${query}" page=${page}`);

    const output = execFileSync(
      "node",
      [searchProbe, query, String(page)],
      {
        cwd: workerDir,
        encoding: "utf8",
        maxBuffer: 30 * 1024 * 1024,
        env: {
          ...process.env,
          SHOPEE_DOMAIN: "shopee.vn",
        },
      }
    );

    const marker = output.lastIndexOf('{\n  "ok"');

    if (marker === -1) continue;

    const result = JSON.parse(
      output.slice(marker).trim()
    );

    if (!result.ok) continue;

    for (const item of result.results || []) {
      all.push({
        ...item,
        search_query: query,
        search_page: page,
      });
    }
  }
}

const unique = Array.from(
  new Map(
    all.map((item) => [
      `${item.shop_id}:${item.item_id}`,
      item,
    ])
  ).values()
);

console.log(
  JSON.stringify(
    {
      ok: true,
      queries,
      pages,
      collected_count: all.length,
      unique_count: unique.length,
      results: unique,
    },
    null,
    2
  )
);
