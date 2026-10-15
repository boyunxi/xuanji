import { ShieldCheck } from "lucide-react";
import { TrendChart } from "../components/charts/TrendChart";
import type { OverviewData, RangeKey } from "../types";

interface ReportsViewProps {
  overview: OverviewData | null;
  range: RangeKey;
}

export function ReportsView({ overview, range }: ReportsViewProps) {
  if (!overview) return null;

  return (
    <div className="reports-content content-enter">
      <div className="report-summary">
        {overview.metrics.slice(0, 3).map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>较上期 {metric.change}</small>
          </div>
        ))}
      </div>
      <TrendChart trend={overview.trend} range={range} large />
      <div className="report-note">
        <ShieldCheck size={17} strokeWidth={1.7} />
        <span>图表与导出数据来自 Go 后端实时统计。</span>
      </div>
    </div>
  );
}
