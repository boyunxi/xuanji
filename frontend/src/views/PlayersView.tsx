import { ArrowRight } from "lucide-react";
import { EmptyRow, TableFooter } from "../components/common/TableFooter";
import { TableToolbar } from "../components/common/TableToolbar";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Player } from "../types";
import { money } from "../utils/format";

interface PlayersViewProps {
  players: Player[];
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  onSelectPlayer: (id: string) => void;
}

export function PlayersView({
  players,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSelectPlayer,
}: PlayersViewProps) {
  return (
    <div className="table-panel content-enter">
      <TableToolbar
        title="玩家列表"
        count={players.length}
        query={query}
        onQuery={onQueryChange}
        status={status}
        onStatus={onStatusChange}
        options={["全部状态", "正常", "已封禁"]}
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>玩家 / 编号</th>
              <th>所属游戏</th>
              <th>等级</th>
              <th>累计充值</th>
              <th>最近登录</th>
              <th>账号状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} onClick={() => onSelectPlayer(player.id)}>
                <td>
                  <div className="person-cell">
                    <span className="person-avatar">{player.name.slice(0, 1)}</span>
                    <span>
                      <strong>{player.name}</strong>
                      <small>{player.id}</small>
                    </span>
                  </div>
                </td>
                <td>{player.game}</td>
                <td>Lv.{player.level}</td>
                <td className="numeric-cell">{money(player.spend)}</td>
                <td>{player.lastActive}</td>
                <td>
                  <StatusBadge value={player.status} />
                </td>
                <td>
                  <button className="row-link">
                    查看 <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!players.length && <EmptyRow span={7} />}
          </tbody>
        </table>
      </div>
      <TableFooter count={players.length} />
    </div>
  );
}
