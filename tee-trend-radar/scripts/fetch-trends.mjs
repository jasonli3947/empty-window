import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const googleTrends = require("google-trends-api");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "public", "trends.json");

const BASELINE = "graphic tee";

/** @type {{ id: string; labelZh: string; labelEn: string; query: string }[]} */
const CATEGORIES = [
  { id: "christmas", labelZh: "圣诞 / 节日", labelEn: "Christmas / holiday", query: "christmas graphic tee" },
  { id: "halloween", labelZh: "万圣节", labelEn: "Halloween", query: "halloween graphic tee" },
  { id: "valentines", labelZh: "情人节", labelEn: "Valentine's", query: "valentines graphic tee" },
  { id: "summer-beach", labelZh: "夏季 / 海滩", labelEn: "Summer / beach", query: "beach graphic tee" },
  { id: "nfl", labelZh: "NFL / 运动", labelEn: "NFL / sports", query: "nfl graphic tee" },
  { id: "pride", labelZh: "骄傲月 / 彩虹", labelEn: "Pride", query: "pride graphic tee" },
  { id: "anime", labelZh: "动漫 / 二次元", labelEn: "Anime", query: "anime graphic tee" },
  { id: "vintage", labelZh: "复古 / Y2K", labelEn: "Vintage / retro", query: "vintage graphic tee" },
  { id: "funny", labelZh: "搞笑 / meme", labelEn: "Funny / meme", query: "funny meme graphic tee" },
  { id: "mom-life", labelZh: "妈妈梗 / 家庭", labelEn: "Mom life", query: "mom life graphic tee" },
  { id: "patriotic", labelZh: "爱国 / 独立日", labelEn: "Patriotic / July 4th", query: "patriotic graphic tee" },
  { id: "christian", labelZh: "信仰 / 基督教", labelEn: "Faith / Christian", query: "christian graphic tee" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse Google Trends timeline; return ratio series category/baseline per day. */
function extractRatioSeries(raw) {
  const data = JSON.parse(raw);
  const timeline = data?.default?.timelineData;
  if (!Array.isArray(timeline)) throw new Error("Unexpected Trends payload");

  const points = [];
  for (const row of timeline) {
    const t = row.time;
    const v = row.value;
    if (!Array.isArray(v) || v.length < 2) continue;
    const cat = Number(v[0]);
    const base = Number(v[1]);
    if (!Number.isFinite(base) || base <= 0) continue;
    const ratio = cat / base;
    points.push({ t, ratio });
  }
  return points;
}

function lastNMean(points, n, key) {
  const slice = points.slice(-n);
  if (!slice.length) return 0;
  const sum = slice.reduce((a, p) => a + p[key], 0);
  return sum / slice.length;
}

async function fetchCategory(cat) {
  const startTime = new Date(Date.now() - 90 * 86400000);
  const raw = await googleTrends.interestOverTime({
    keyword: [cat.query, BASELINE],
    startTime,
    geo: "US",
  });
  const series = extractRatioSeries(raw);
  const spark = series.slice(-28).map((p) => Math.round(p.ratio * 1000) / 1000);
  const heat7 = lastNMean(series, 7, "ratio");
  const heat30 = lastNMean(series, 30, "ratio");
  return {
    id: cat.id,
    labelZh: cat.labelZh,
    labelEn: cat.labelEn,
    query: cat.query,
    heat7,
    heat30,
    sparkline: spark,
  };
}

async function main() {
  const results = [];
  for (const cat of CATEGORIES) {
    try {
      const row = await fetchCategory(cat);
      results.push(row);
      await sleep(1500);
    } catch (e) {
      console.error(`Failed: ${cat.id}`, e?.message || e);
      results.push({
        id: cat.id,
        labelZh: cat.labelZh,
        labelEn: cat.labelEn,
        query: cat.query,
        heat7: null,
        heat30: null,
        sparkline: [],
        error: String(e?.message || e),
      });
      await sleep(2000);
    }
  }

  const valid = results.filter((r) => r.heat7 != null && Number.isFinite(r.heat7));
  let maxH = 0;
  for (const r of valid) maxH = Math.max(maxH, r.heat7);
  const normalized = results.map((r) => ({
    ...r,
    heatScore: r.heat7 != null && maxH > 0 ? Math.round((r.heat7 / maxH) * 100) : null,
  }));

  const payload = {
    generatedAt: new Date().toISOString(),
    geo: "US",
    windowDays: 90,
    baselineQuery: BASELINE,
    methodology:
      "每个主题与同一时间段内的「graphic tee」搜索热度做比值，再取近 7 天平均；heatScore 为当日批次内相对排名（0–100）。数据来自 Google Trends，反映搜索意图而非具体电商销量。",
    methodologyEn:
      "Each theme is ratioed vs US search interest for \"graphic tee\" over the same window; heat7 is the 7-day mean of that ratio. heatScore is relative within this snapshot (0–100). Source: Google Trends (demand signal, not retailer sales).",
    categories: normalized.sort((a, b) => (b.heat7 ?? 0) - (a.heat7 ?? 0)),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
