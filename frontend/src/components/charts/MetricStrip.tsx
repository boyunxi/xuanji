import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { MetricItem } from "../../types";

interface MetricStripProps {
  metrics: MetricItem[];
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <section className="metrics-strip" aria-label="关键指标">
      {metrics.map((metric, index) => (
        <div
          className="metric"
          key={metric.label}
          style={{ animationDelay: `${index * 85}ms` }}
        >
          <div className="metric-label">
            <span className="metric-mark" />
            {metric.label}
          </div>
          <div className="metric-value">
            {metric.value}
            <span className="metric-unit">{metric.unit}</span>
          </div>
          <div className="metric-comparison">
            <span className={metric.up ? "change positive" : "change negative"}>
              {metric.up ? (
                <ArrowUpRight size={14} strokeWidth={2} />
              ) : (
                <ArrowDownRight size={14} strokeWidth={2} />
              )}
              {metric.change}
            </span>
            <span>较上期</span>
          </div>
        </div>
      ))}
    </section>
  );
}
