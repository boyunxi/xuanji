interface TableFooterProps {
  count: number;
}

export function TableFooter({ count }: TableFooterProps) {
  return (
    <div className="table-footer">
      <span>共 {count} 条记录</span>
      <span>已显示全部</span>
    </div>
  );
}

export function EmptyRow({ span }: { span: number }) {
  return (
    <tr>
      <td colSpan={span} className="empty-row">
        暂无符合条件的记录
      </td>
    </tr>
  );
}
