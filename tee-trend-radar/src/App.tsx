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
      .map((v, i) => {
        const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
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

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function App() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/trends.json?cb=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Payload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(String((e as Error).message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <div>
        <h1>印花 T 恤趋势雷达</h1>
        <p className="err">无法加载数据：{err}</p>
        <p className="foot">请确认已运行开发服务器，且 public/trends.json 存在。</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1>印花 T 恤趋势雷达</h1>
        <p className="loading">正在加载 Google Trends 聚合结果…</p>
      </div>
    );
  }

  const sorted = [...data.categories].sort((a, b) => (b.heatScore ?? 0) - (a.heatScore ?? 0));

  return (
    <div>
      <h1>印花 T 恤主题热度 · 美国市场</h1>
      <p className="sub">
        用可复现的搜索关键词近似「美国人今天在找什么风格的印花 Tee」。不直接抓取亚马逊或
        Etsy 的站内榜单（接口与条款限制多），而是用 Google Trends 的<strong>相对需求信号</strong>
        ，并与「graphic tee」基线做比值，便于横向对比不同主题。
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

      <div className="grid">
        {sorted.map((c) => (
          <article key={c.id} className="card">
            <div className="card-head">
              <div className="card-title">
                {c.labelZh}
                <small>{c.labelEn}</small>
              </div>
              <div className="score">{c.heatScore != null ? c.heatScore : "—"}</div>
            </div>
            <div className="bar-wrap" title="相对热度（本批次内 0–100）">
              <div className="bar" style={{ width: `${c.heatScore ?? 0}%` }} />
            </div>
            <Sparkline values={c.sparkline} />
            <div className="query">{c.query}</div>
            {c.error ? <div className="err">{c.error}</div> : null}
          </article>
        ))}
      </div>

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
          每日更新：在本地或服务器定时执行 <kbd>npm run update-data</kbd>
          ，会重写 <kbd>public/trends.json</kbd>；静态托管（如 GitHub Pages）可在 Action 里定时跑同一命令并部署。
        </p>
      </footer>
    </div>
  );
}
