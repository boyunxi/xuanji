import { ArrowRight } from "lucide-react";
import { EmptyRow, TableFooter } from "../components/common/TableFooter";
import { TableToolbar } from "../components/common/TableToolbar";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Event } from "../types";
import { number } from "../utils/format";

interface EventsViewProps {
  events: Event[];
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  onSelectEvent: (id: string) => void;
}

export function EventsView({
  events,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSelectEvent,
}: EventsViewProps) {
  return (
    <div className="table-panel content-enter">
      <TableToolbar
        title="活动列表"
        count={events.length}
        query={query}
        onQuery={onQueryChange}
        status={status}
        onStatus={onStatusChange}
        options={["全部状态", "进行中", "未开始", "已结束"]}
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>活动名称 / 编号</th>
              <th>所属游戏</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>参与玩家</th>
              <th>活动状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {events.map((item) => (
              <tr key={item.id} onClick={() => onSelectEvent(item.id)}>
                <td>
                  <div className="name-cell">
                    <strong>{item.title}</strong>
                    <small>{item.id}</small>
                  </div>
                </td>
                <td>{item.game}</td>
                <td>{item.start}</td>
                <td>{item.end}</td>
                <td className="numeric-cell">{number(item.participants)}</td>
                <td>
                  <StatusBadge value={item.status} />
                </td>
                <td>
                  <button className="row-link">
                    查看 <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!events.length && <EmptyRow span={7} />}
          </tbody>
        </table>
      </div>
      <TableFooter count={events.length} />
    </div>
  );
}
