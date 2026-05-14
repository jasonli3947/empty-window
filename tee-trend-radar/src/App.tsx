import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  labelZh: string;
  labelEn: string;
  query: string;
  heat7: number | null;
  heat30: number | null;
  heatScore: number | null;
  sparkline: number[];
  error?: string;
};

type Payload = {
  generatedAt: string;
  geo: string;
  windowDays: number;
  baselineQuery: string;
  methodology: string;
  methodologyEn: string;
  categories: Category[];
};

type ThemeMeta = {
  type: "evergreen" | "seasonal";
  peakMonths?: number[];
  prepLeadDays?: number;
  motifIdeas: string[];
  note: string;
};

type Signal = {
  label: string;
  detail: string;
  points: number;
};

type SeasonSignal = Signal & {
  phase: "evergreen" | "in-season" | "prep-now" | "prep" | "soon" | "far";
};

type ActionInfo = {
  label: string;
  tone: "hot" | "warm" | "cool" | "muted";
};

type EvaluatedCategory = Category & {
  meta: ThemeMeta;
  demand: Signal;
  momentum: Signal;
  season: SeasonSignal;
  action: ActionInfo;
  recommendationScore: number;
  prepareScore: number;
  advice: string;
};

const MONTHS_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const THEME_META: Record<string, ThemeMeta> = {
  vintage: {
    type: "evergreen",
    motifIdeas: ["70s sunset", "distressed 字体", "复古赛车", "西部牛仔"],
    note: "全年常青，偏审美款，适合做长期款池。",
  },
  funny: {
    type: "evergreen",
    motifIdeas: ["职场吐槽", "社恐文案", "咖啡梗", "宠物梗"],
    note: "更适合小步快跑，多测文案而不是押单一图。",
  },
  anime: {
    type: "evergreen",
    motifIdeas: ["日系排版", "机甲轮廓", "像素风", "热血标语"],
    note: "常青但波动大，适合做小批量测试和快速迭代。",
  },
  christian: {
    type: "evergreen",
    motifIdeas: ["Bible verse", "简洁十字", "faith over fear", "grace 字体"],
    note: "全年有底盘，适合走简洁文字与信仰符号路线。",
  },
  "mom-life": {
    type: "evergreen",
    motifIdeas: ["妈妈梗文案", "手写字", "家庭日常", "母亲节延展"],
    note: "常青题材，但更吃文案表达和礼物场景。",
  },
  "summer-beach": {
    type: "seasonal",
    peakMonths: [4, 5, 6],
    prepLeadDays: 30,
    motifIdeas: ["海滩日落", "palm tree", "vacation club", "复古 surf"],
    note: "夏季题材窗口较短，适合在 5-7 月快速上新。",
  },
  pride: {
    type: "seasonal",
    peakMonths: [4, 5],
    prepLeadDays: 35,
    motifIdeas: ["彩虹排版", "inclusive slogan", "minimal icon", "bold typography"],
    note: "强季节性，通常在 5-6 月前后集中起量。",
  },
  patriotic: {
    type: "seasonal",
    peakMonths: [5, 6],
    prepLeadDays: 45,
    motifIdeas: ["vintage USA", "stars and stripes", "retro eagle", "July 4th slogan"],
    note: "独立日前起量明显，应该提前准备设计与 listing。",
  },
  nfl: {
    type: "seasonal",
    peakMonths: [7, 8, 9, 10],
    prepLeadDays: 45,
    motifIdeas: ["football mom", "tailgate club", "game day 字体", "team spirit"],
    note: "NFL 相关需求通常在赛季前开始升温。",
  },
  halloween: {
    type: "seasonal",
    peakMonths: [8, 9],
    prepLeadDays: 60,
    motifIdeas: ["spooky cute", "witch typography", "pumpkin retro", "ghost meme"],
    note: "万圣节需要更早做题库，通常 7-8 月就该准备。",
  },
  valentines: {
    type: "seasonal",
    peakMonths: [0, 1],
    prepLeadDays: 45,
    motifIdeas: ["coquette bow", "romantic quote", "heart typography", "gift humor"],
    note: "情人节属于节令礼物场景，过季后应降权。",
  },
  christmas: {
    type: "seasonal",
    peakMonths: [10, 11],
    prepLeadDays: 75,
    motifIdeas: ["vintage Santa", "cozy holiday", "funny family christmas", "retro ornament"],
    note: "Q4 大季，但需要提前做款式储备和关键词布局。",
  },
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatMonthWindow(months?: number[]) {
  if (!months?.length) return "全年";
  return months.map((month) => MONTHS_ZH[month]).join(" / ");
}

function nextPeakDate(months: number[], now: Date) {
  const candidates = months
    .flatMap((month) => [new Date(now.getFullYear(), month, 1), new Date(now.getFullYear() + 1, month, 1)])
    .filter((date) => date.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

function getDemandSignal(category: Category, maxHeat7: number): Signal {
  const baseline = maxHeat7 > 0 && category.heat7 != null ? (category.heat7 / maxHeat7) * 100 : 0;
  if (baseline >= 55) {
    return { label: "高", detail: "当前在这批主题里最靠前", points: 95 };
  }
  if (baseline >= 18) {
    return { label: "中", detail: "有一定搜索底盘", points: 68 };
  }
  if (baseline >= 5) {
    return { label: "低", detail: "有零散需求，适合轻量试款", points: 42 };
  }
  if (baseline > 0) {
    return { label: "很低", detail: "现在不是强需求主题", points: 20 };
  }
  return { label: "接近静默", detail: "搜索信号极弱，别把它当成现在卖点", points: 8 };
}

function getMomentumSignal(values: number[]): Signal {
  const recent = average(values.slice(-7));
  const previous = average(values.slice(-14, -7));
  const delta = previous > 0 ? (recent - previous) / previous : recent > 0 ? 1 : 0;

  if (delta >= 0.2) {
    return { label: "快速上升", detail: "最近 7 天明显高于前一周", points: 90 };
  }
  if (delta >= 0.05) {
    return { label: "缓慢上升", detail: "近期有起量迹象", points: 72 };
  }
  if (delta > -0.08) {
    return { label: "平稳", detail: "近期没有明显变化", points: 52 };
  }
  if (delta > -0.2) {
    return { label: "回落", detail: "热度在往下走", points: 28 };
  }
  return { label: "明显下滑", detail: "最近 7 天弱于前一周", points: 12 };
}

function getSeasonSignal(meta: ThemeMeta, now: Date): SeasonSignal {
  if (meta.type === "evergreen") {
    return {
      label: "全年常青",
      detail: "不依赖固定节日窗口",
      points: 72,
      phase: "evergreen",
    };
  }

  const currentMonth = now.getMonth();
  const peakMonths = meta.peakMonths ?? [];
  if (peakMonths.includes(currentMonth)) {
    return {
      label: "正在窗口内",
      detail: `高峰月通常在 ${formatMonthWindow(peakMonths)}`,
      points: 96,
      phase: "in-season",
    };
  }

  const nextPeak = nextPeakDate(peakMonths, now);
  if (!nextPeak) {
    return {
      label: "季节信息缺失",
      detail: "请补充主题季节性配置",
      points: 20,
      phase: "far",
    };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const daysUntil = Math.ceil((nextPeak.getTime() - now.getTime()) / dayMs);
  const prepLeadDays = meta.prepLeadDays ?? 45;

  if (daysUntil <= Math.max(14, Math.round(prepLeadDays * 0.5))) {
    return {
      label: `${daysUntil} 天后进入旺季`,
      detail: "现在就该备货、补主图、做 listing",
      points: 82,
      phase: "prep-now",
    };
  }

  if (daysUntil <= prepLeadDays) {
    return {
      label: `${daysUntil} 天后进入窗口`,
      detail: "开始设计，准备 2-3 个变体",
      points: 66,
      phase: "prep",
    };
  }

  if (daysUntil <= 90) {
    return {
      label: "90 天内会起量",
      detail: `高峰月在 ${formatMonthWindow(peakMonths)}，先做题库`,
      points: 48,
      phase: "soon",
    };
  }

  return {
    label: `离旺季约 ${Math.ceil(daysUntil / 30)} 个月`,
    detail: `下一轮高峰大多在 ${formatMonthWindow(peakMonths)}`,
    points: 16,
    phase: "far",
  };
}

function getAction(meta: ThemeMeta, season: SeasonSignal, demand: Signal, momentum: Signal, recommendationScore: number): ActionInfo {
  if (meta.type === "seasonal") {
    if (season.phase === "in-season") {
      if (demand.points >= 42 || momentum.points >= 72) {
        return { label: "现在上新", tone: "hot" };
      }
      return { label: "小量试款", tone: "warm" };
    }
    if (season.phase === "prep-now") {
      return { label: "提前备货", tone: "warm" };
    }
    if (season.phase === "prep" || season.phase === "soon") {
      return { label: "开始设计", tone: "cool" };
    }
    return { label: "暂缓重仓", tone: "muted" };
  }

  if (recommendationScore >= 78) {
    return { label: "现在主推", tone: "hot" };
  }
  if (demand.points >= 42 || momentum.points >= 72) {
    return { label: "小批量测试", tone: "warm" };
  }
  return { label: "保留题库", tone: "muted" };
}

function buildAdvice(meta: ThemeMeta, action: ActionInfo, demand: Signal, momentum: Signal, season: SeasonSignal) {
  if (action.label === "现在主推") {
    return `这是更适合长期卖的常青主题。当前需求 ${demand.label}、动能 ${momentum.label}，适合多版式并行测试。`;
  }
  if (action.label === "小批量测试") {
    return `现在还不适合重仓，但有一定底盘。先用 2-3 个图案方向试反应，再决定是否放量。`;
  }
  if (action.label === "现在上新") {
    return `已经进入销售窗口，应该立刻上架并更新主图。需求 ${demand.label}，要抓住短期成交期。`;
  }
  if (action.label === "小量试款") {
    return `已经进窗口，但搜索还不算强。适合先挂少量款式，别一次做太多。`;
  }
  if (action.label === "提前备货") {
    return `距离旺季不远，重点不是看今天分数，而是把设计、样衣和关键词先准备好。`;
  }
  if (action.label === "开始设计") {
    return `未来 90 天内会进入窗口。现在先建立题库和版式池，比现在冲销量更重要。`;
  }
  if (meta.type === "seasonal") {
    return `当前离销售窗口还远，别把它当现在的主力。先放在季节题库里，等 ${season.detail} 再拉高优先级。`;
  }
  return `这类题材属于常青小众。不是不能做，而是不适合占用你现在的主产能。`;
}

function evaluateCategory(category: Category, maxHeat7: number, now: Date): EvaluatedCategory {
  const meta = THEME_META[category.id] ?? {
    type: "evergreen",
    motifIdeas: ["文字排版", "图标符号", "复古配色", "轻插画"],
    note: "未配置细分策略，建议按常青主题处理。",
  };

  const demand = getDemandSignal(category, maxHeat7);
  const momentum = getMomentumSignal(category.sparkline);
  const season = getSeasonSignal(meta, now);
  const recommendationScore = Math.round(demand.points * 0.45 + momentum.points * 0.2 + season.points * 0.35);
  const prepareScore =
    season.phase === "prep-now"
      ? 100
      : season.phase === "prep"
        ? 85
        : season.phase === "soon"
          ? 70
          : season.phase === "in-season"
            ? 45
            : 0;
  const action = getAction(meta, season, demand, momentum, recommendationScore);
  const advice = buildAdvice(meta, action, demand, momentum, season);

  return {
    ...category,
    meta,
    demand,
    momentum,
    season,
    action,
    recommendationScore,
    prepareScore,
    advice,
  };
}

function Sparkline({ values }: { values: number[] }) {
  const d = useMemo(() => {
    if (!values.length) return "";
    const w = 200;
    const h = 44;
    const pad = 2;
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 0.05;
      max += 0.05;
    }
    return values
      .map((value, index) => {
        const x = pad + (index / Math.max(values.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - ((value - min) / (max - min)) * (h - pad * 2);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [values]);

  if (!values.length) return <div className="spark" aria-hidden />;

  return (
    <svg className="spark" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  );
}

export function App() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL;
        const res = await fetch(`${base}trends.json?cb=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Payload;
        if (!cancelled) setData(json);
      } catch (error) {
        if (!cancelled) setErr(String((error as Error).message || error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const evaluated = useMemo(() => {
    if (!data) return [];
    const maxHeat7 = Math.max(...data.categories.map((category) => category.heat7 ?? 0), 0);
    const now = new Date(data.generatedAt);
    return data.categories
      .map((category) => evaluateCategory(category, maxHeat7, now))
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }, [data]);

  if (err) {
    return (
      <div>
        <h1>印花 T 恤选题雷达</h1>
        <p className="err">无法加载数据：{err}</p>
        <p className="foot">请确认已运行开发服务器，且 public/trends.json 存在。</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1>印花 T 恤选题雷达</h1>
        <p className="loading">正在加载 Google Trends 聚合结果…</p>
      </div>
    );
  }

  const nowFocus = evaluated
    .filter((category) => ["现在主推", "现在上新", "小批量测试", "小量试款"].includes(category.action.label))
    .slice(0, 4);
  const next90 = evaluated
    .filter((category) => category.prepareScore > 0)
    .sort((a, b) => b.prepareScore - a.prepareScore || b.recommendationScore - a.recommendationScore)
    .slice(0, 4);

  return (
    <div>
      <h1>印花 T 恤选题雷达 · 美国市场</h1>
      <p className="sub">
        这版不再把一个抽象热度分数直接丢给你，而是把 Google Trends 信号翻译成
        <strong>「现在主推 / 提前备货 / 暂缓重仓」</strong>。先看动作建议，再看热度细节。
      </p>

      <div className="meta-bar">
        <span>
          数据时间：<strong>{formatTime(data.generatedAt)}</strong>
        </span>
        <span>
          区域：<strong>{data.geo}</strong>
        </span>
        <span>
          基线词：<strong>{data.baselineQuery}</strong>
        </span>
        <span>
          回看窗口：<strong>{data.windowDays}</strong> 天
        </span>
      </div>

      <div className="callout">
        <strong>怎么看：</strong>卡片上的 <code>0</code> 或低需求并不等于“永远不要做”，很多节日类主题只是
        <strong>现在还没到销售窗口</strong>。因此请优先看「现在建议」和「季节窗口」。
      </div>

      <section className="section">
        <SectionTitle title="现在值得主推" desc="适合你这周就上架、扩款或继续测试的方向。" />
        <div className="summary-grid">
          {nowFocus.map((category) => (
            <article key={category.id} className="summary-card">
              <div className="summary-head">
                <div>
                  <div className="summary-title">{category.labelZh}</div>
                  <div className="summary-sub">{category.labelEn}</div>
                </div>
                <span className={`pill pill-${category.action.tone}`}>{category.action.label}</span>
              </div>
              <p className="summary-text">{category.advice}</p>
              <div className="chip-row">
                {category.meta.motifIdeas.slice(0, 3).map((idea) => (
                  <span key={idea} className="chip">
                    {idea}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle title="未来 90 天先准备什么" desc="这些主题不一定今天最热，但很可能是你接下来该备的季节单。" />
        <div className="summary-grid">
          {next90.map((category) => (
            <article key={category.id} className="summary-card">
              <div className="summary-head">
                <div>
                  <div className="summary-title">{category.labelZh}</div>
                  <div className="summary-sub">{category.season.label}</div>
                </div>
                <span className={`pill pill-${category.action.tone}`}>{category.action.label}</span>
              </div>
              <p className="summary-text">{category.meta.note}</p>
              <div className="chip-row">
                {category.meta.motifIdeas.slice(0, 3).map((idea) => (
                  <span key={idea} className="chip">
                    {idea}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionTitle
          title="全部主题决策卡"
          desc="每张卡都把“当前需求、动能、季节窗口”三件事拆开，方便你判断是否适合拿来印。"
        />
        <div className="grid">
          {evaluated.map((category) => (
            <article key={category.id} className="card">
              <div className="card-head">
                <div className="card-title">
                  {category.labelZh}
                  <small>{category.labelEn}</small>
                </div>
                <div className="score-wrap">
                  <div className="score-label">推荐指数</div>
                  <div className="score">{category.recommendationScore}</div>
                </div>
              </div>

              <div className="pill-row">
                <span className={`pill pill-${category.action.tone}`}>{category.action.label}</span>
                <span className="pill pill-neutral">
                  {category.meta.type === "evergreen" ? "常青型" : "季节型"}
                </span>
              </div>

              <p className="advice">{category.advice}</p>

              <div className="signal-grid">
                <div className="signal-card">
                  <div className="signal-label">当前需求</div>
                  <div className="signal-value">{category.demand.label}</div>
                  <div className="signal-detail">{category.demand.detail}</div>
                </div>
                <div className="signal-card">
                  <div className="signal-label">上升动能</div>
                  <div className="signal-value">{category.momentum.label}</div>
                  <div className="signal-detail">{category.momentum.detail}</div>
                </div>
                <div className="signal-card">
                  <div className="signal-label">季节窗口</div>
                  <div className="signal-value">{category.season.label}</div>
                  <div className="signal-detail">{category.season.detail}</div>
                </div>
              </div>

              <div className="bar-wrap" title="推荐指数（综合当前需求、动能与季节窗口）">
                <div className="bar" style={{ width: `${category.recommendationScore}%` }} />
              </div>

              <Sparkline values={category.sparkline} />

              <div className="chip-row">
                {category.meta.motifIdeas.map((idea) => (
                  <span key={idea} className="chip">
                    {idea}
                  </span>
                ))}
              </div>

              <div className="query">{category.query}</div>
              <div className="mini-note">{category.meta.note}</div>
              {category.error ? <div className="err">{category.error}</div> : null}
            </article>
          ))}
        </div>
      </section>

      <footer className="foot">
        <p>
          <strong>方法说明（中文）：</strong>
          {data.methodology}
        </p>
        <p>
          <strong>Methodology (EN): </strong>
          {data.methodologyEn}
        </p>
        <p>
          线上站点由 GitHub Pages 部署；数据文件为仓库内 <code>trends.json</code>，与「刷新 Trends」工作流结果一致。
          当前页面在 Trends 原始信号之上加入了人工定义的季节窗口和题材建议，用来回答“接下来该印什么”。
        </p>
      </footer>
    </div>
  );
}
