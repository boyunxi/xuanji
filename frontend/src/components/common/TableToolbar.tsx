import { Search } from "lucide-react";
import { AncientSelect } from "./AncientSelect";

interface TableToolbarProps {
  title: string;
  count: number;
  query: string;
  onQuery: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  options: string[];
}

export function TableToolbar({
  title,
  count,
  query,
  onQuery,
  status,
  onStatus,
  options,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-title">
        <h2>{title}</h2>
        <span>{count} 条记录</span>
      </div>
      <div className="table-filters">
        <label className="table-search">
          <Search size={16} strokeWidth={1.8} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="搜索名称或编号"
          />
        </label>
        <AncientSelect
          value={status}
          onChange={onStatus}
          options={options}
          ariaLabel="筛选状态"
        />
      </div>
    </div>
  );
}
