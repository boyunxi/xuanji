import { ArrowRight } from "lucide-react";
import { EmptyRow, TableFooter } from "../components/common/TableFooter";
import { TableToolbar } from "../components/common/TableToolbar";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Order } from "../types";
import { money } from "../utils/format";

interface OrdersViewProps {
  orders: Order[];
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  onSelectOrder: (id: string) => void;
}

export function OrdersView({
  orders,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSelectOrder,
}: OrdersViewProps) {
  return (
    <div className="table-panel content-enter">
      <TableToolbar
        title="订单列表"
        count={orders.length}
        query={query}
        onQuery={onQueryChange}
        status={status}
        onStatus={onStatusChange}
        options={["全部状态", "成功", "处理中", "已退款"]}
      />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>订单编号</th>
              <th>玩家</th>
              <th>所属游戏</th>
              <th>订单金额</th>
              <th>支付方式</th>
              <th>创建时间</th>
              <th>订单状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => onSelectOrder(order.id)}>
                <td className="order-id">{order.id}</td>
                <td>{order.player}</td>
                <td>{order.game}</td>
                <td className="numeric-cell amount-cell">{money(order.amount)}</td>
                <td>{order.method}</td>
                <td>{order.time}</td>
                <td>
                  <StatusBadge value={order.status} />
                </td>
                <td>
                  <button className="row-link">
                    查看 <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!orders.length && <EmptyRow span={8} />}
          </tbody>
        </table>
      </div>
      <TableFooter count={orders.length} />
    </div>
  );
}
