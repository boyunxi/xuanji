import { useEffect, useRef, useState } from "react";
import type { RangeKey, TrendData } from "../../types";
import { number, smoothPath } from "../../utils/format";

interface TrendChartProps {
  trend: TrendData;
  range: RangeKey;
  large?: boolean;
}

export function TrendChart({ trend, range, large = false }: TrendChartProps) {
  const [focused, setFocused] = useState(6);
  const [chartWidth, setChartWidth] = useState(700);
  const canvasRef = useRef<HTMLDivElement>(null);

  const values = trend.values || [0, 0, 0, 0, 0, 0, 0];
  const labels = trend.labels || ["", "", "", "", "", "", ""];
  const max = trend.max || 120000;

  const points = values.map((value, index) => ({
    x: 52 + index * ((chartWidth - 84) / Math.max(1, values.length - 1)),
    y: 185 - (value / max) * 159,
  }));
  const line = smoothPath(points);
  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x} 185 L ${points[0].x} 185 Z`
      : "";

  useEffect(() => {
    if (values.length > 0) setFocused(values.length - 1);
  }, [trend]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setChartWidth(canvas.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const curFocus = Math.min(focused, Math.max(0, values.length - 1));

  return (
    <section className={`chart-panel trend-panel ${large ? "large-chart" : ""}`}>
      <div className="panel-heading">
        <div>
          <div className="section-title-line">
            <span className="title-rule" />
            <h2>玩家活跃趋势</h2>
          </div>
          <p>{range === "today" ? "今日分时活跃玩家" : "每日活跃玩家变化"}</p>
        </div>
        <div className="chart-current">
          <span className="current-dot" />
          {labels[curFocus]}
          <strong>
            {number(values[curFocus] || 0)} <small>人</small>
          </strong>
        </div>
      </div>
      <div className="trend-canvas" ref={canvasRef}>
        <svg
          viewBox={`0 0 ${chartWidth} 230`}
          preserveAspectRatio="none"
          role="img"
          aria-label="玩家活跃趋势折线图"
        >
          <defs>
            <linearGradient
              id={`chart-fill-${large ? "large" : "small"}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#467767" stopOpacity="0.19" />
              <stop offset="100%" stopColor="#467767" stopOpacity="0.005" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((tick) => {
            const y = 185 - tick * 53;
            const value = (max / 3) * tick;
            return (
              <g key={tick}>
                <line
                  x1="52"
                  x2={chartWidth - 26}
                  y1={y}
                  y2={y}
                  className="chart-grid-line"
                />
                <text x="0" y={y + 4} className="axis-label">
                  {value === 0 ? "0" : `${Math.round(value / 10000)}万`}
                </text>
              </g>
            );
          })}
          {area && (
            <path
              d={area}
              fill={`url(#chart-fill-${large ? "large" : "small"})`}
              className="chart-area"
            />
          )}
          {line && <path d={line} className="chart-line" />}
          {points[curFocus] && (
            <line
              x1={points[curFocus].x}
              x2={points[curFocus].x}
              y1={points[curFocus].y}
              y2="185"
              className="chart-guide"
            />
          )}
          {points.map((point, index) => (
            <g
              key={index}
              onMouseEnter={() => setFocused(index)}
              onFocus={() => setFocused(index)}
              tabIndex={0}
              aria-label={`${labels[index]} ${number(values[index])}人`}
              className="chart-point-group"
            >
              <circle cx={point.x} cy={point.y} r="16" fill="transparent" />
              {curFocus === index && (
                <>
                  <circle cx={point.x} cy={point.y} r="9" fill="#3f7565" opacity="0.16" />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4.5"
                    fill="#3f7565"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          ))}
          {labels.map((label, index) => (
            <text
              key={`${label}-${index}`}
              x={points[index]?.x || 0}
              y="219"
              textAnchor="middle"
              className="axis-label date-label"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
