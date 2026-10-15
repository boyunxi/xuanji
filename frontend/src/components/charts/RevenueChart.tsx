import type { RevenuePart } from "../../types";
import { money } from "../../utils/format";

interface RevenueChartProps {
  revenue: number;
  parts?: RevenuePart[];
}

export function RevenueChart({ revenue, parts }: RevenueChartProps) {
  const defaultParts: RevenuePart[] = [
    { name: "游戏充值", percent: 62, color: "#3d7565", amount: 0 },
    { name: "月卡通行证", percent: 26, color: "#bf9a62", amount: 0 },
    { name: "礼包购买", percent: 12, color: "#b96d58", amount: 0 },
  ];
  const activeParts = parts && parts.length ? parts : defaultParts;
  const circumference = 2 * Math.PI * 72;
  let progress = 0;

  return (
    <section className="chart-panel revenue-panel">
      <div className="panel-heading">
        <div>
          <div className="section-title-line">
            <span className="title-rule" />
            <h2>营收构成</h2>
          </div>
          <p>按商品类型统计</p>
        </div>
        <span className="panel-note">收入占比</span>
      </div>
      <div className="revenue-content">
        <div className="donut-wrap">
          <svg viewBox="0 0 200 200" role="img" aria-label="营收构成环形图">
            <circle cx="100" cy="100" r="72" fill="none" stroke="#edeae2" strokeWidth="15" />
            {activeParts.map((part) => {
              const offset = progress;
              progress += part.percent;
              return (
                <circle
                  key={part.name}
                  cx="100"
                  cy="100"
                  r="72"
                  fill="none"
                  stroke={part.color}
                  strokeWidth="15"
                  strokeDasharray={`${(part.percent / 100) * circumference - 3} ${circumference}`}
                  strokeDashoffset={-(offset / 100) * circumference}
                  className="donut-segment"
                />
              );
            })}
          </svg>
          <div className="donut-center">
            <span>营收总额</span>
            <strong>
              {revenue >= 1000000 ? `¥${(revenue / 10000).toFixed(1)}万` : money(revenue)}
            </strong>
          </div>
        </div>
        <div className="revenue-legend">
          {activeParts.map((part) => (
            <div className="legend-row" key={part.name}>
              <div>
                <i style={{ background: part.color }} />
                <span>{part.name}</span>
              </div>
              <strong>{part.percent}%</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="revenue-foot">营收分布稳定，数据由 Go 后端实时持久化。</div>
    </section>
  );
}
