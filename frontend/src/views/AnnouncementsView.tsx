import { ArrowRight } from "lucide-react";
import { EmptyRow, TableFooter } from "../components/common/TableFooter";
import { TableToolbar } from "../components/common/TableToolbar";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Announcement } from "../types";

interface AnnouncementsViewProps {
  announcements: Announcement[];
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  onSelectAnnouncement: (id: string) => void;
}

export function AnnouncementsView({
  announcements,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSelectAnnouncement,
}: AnnouncementsViewProps) {
  return (
    <div className="table-panel content-enter">
      <TableToolbar
        title="公告列表"
        count={announcements.length}
        query={query}
        onQuery={onQueryChange}
        status={status}
        onStatus={onStatusChange}
        options={["全部状态", "已发布", "草稿"]}
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>公告标题 / 编号</th>
              <th>所属游戏</th>
              <th>创建日期</th>
              <th>内容摘要</th>
              <th>发布状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((item) => (
              <tr key={item.id} onClick={() => onSelectAnnouncement(item.id)}>
                <td>
                  <div className="name-cell">
                    <strong>{item.title}</strong>
                    <small>{item.id}</small>
                  </div>
                </td>
                <td>{item.game}</td>
                <td>{item.date}</td>
                <td className="excerpt-cell">{item.content}</td>
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
            {!announcements.length && <EmptyRow span={6} />}
          </tbody>
        </table>
      </div>
      <TableFooter count={announcements.length} />
    </div>
  );
}
