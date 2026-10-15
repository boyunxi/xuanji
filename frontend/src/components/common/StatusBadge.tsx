interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const tone = ["正常", "进行中", "已发布", "成功"].includes(value)
    ? "good"
    : ["未开始", "草稿", "处理中"].includes(value)
    ? "waiting"
    : ["已封禁", "已退款"].includes(value)
    ? "alert"
    : "quiet";

  return (
    <span className={`status-text ${tone}`}>
      <i />
      {value}
    </span>
  );
}
