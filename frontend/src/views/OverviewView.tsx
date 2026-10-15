import { ArrowRight } from "lucide-react";
import { MetricStrip } from "../components/charts/MetricStrip";
import { RevenueChart } from "../components/charts/RevenueChart";
import { TrendChart } from "../components/charts/TrendChart";
import type { Game, OverviewData, PageId, RangeKey } from "../types";

interface OverviewViewProps {
  overview: OverviewData | null;
  range: RangeKey;
  game: Game;
  onNavigate: (page: PageId) => void;
  onResetGameAndNavigate: (page: PageId) => void;
}

export function OverviewView({
  overview,
  range,
  game,
  onNavigate,
  onResetGameAndNavigate,
}: OverviewViewProps) {
  if (!overview) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8b968c" }}>
        正在加载运营总览数据...
      </div>
    );
  }

  return (
    <div className="overview-content content-enter" key={`overview-${range}-${game}`}>
      <MetricStrip metrics={overview.metrics} />
      <div className="charts-grid">
        <TrendChart trend={overview.trend} range={range} />
        <RevenueChart
          revenue={overview.totalRevenue}
          parts={overview.revenueParts}
        />
      </div>
      <div className="lower-grid">
        <section className="list-panel">
          <div className="lower-heading">
            <div className="section-title-line">
              <span className="title-rule" />
              <h2>待办事项</h2>
            </div>
            <button className="text-link" onClick={() => onNavigate("events")}>
              查看活动 <ArrowRight size={15} />
            </button>
          </div>
          <div className="todo-list">
            {overview.todos.map((todo) => (
              <button
                key={todo.index}
                onClick={() => onResetGameAndNavigate(todo.page)}
              >
                <span className="todo-index">{todo.index}</span>
                <span className="todo-copy">
                  <strong>{todo.title}</strong>
                  <small>{todo.subtitle}</small>
                </span>
                <span className="todo-action">
                  {todo.action} <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="list-panel">
          <div className="lower-heading">
            <div className="section-title-line">
              <span className="title-rule" />
              <h2>近期动态</h2>
            </div>
            <span className="quiet-label">实时日志</span>
          </div>
          <div className="activity-list">
            {overview.activities.map((act, idx) => (
              <button key={idx} onClick={() => onNavigate(act.page)}>
                <span className="activity-line">
                  <i />
                </span>
                <span>
                  <strong>{act.title}</strong>
                  <small>{act.subtitle}</small>
                </span>
                <time>{act.time}</time>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
