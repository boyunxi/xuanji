interface StatusBadgeProps {
  value?: string;
  status?: string;
  className?: string;
}

export function StatusBadge({ value, status, className = "" }: StatusBadgeProps) {
  const text = value || status || "";
  const tone = [
    "正常",
    "进行中",
    "上架中",
    "已发布",
    "成功",
    "生效中",
    "已生效",
    "已执行",
    "已发送",
    "active",
  ].includes(text)
    ? "good"
    : ["未开始", "已暂停", "草稿", "处理中", "待生效", "待核销", "pending"].includes(text)
    ? "waiting"
    : ["已封禁", "已退款", "已失效", "紧急", "异常", "高危", "banned"].includes(text)
    ? "alert"
    : "quiet";

  return (
    <span
      className={`status-text ${tone} ${className}`}
      style={{ whiteSpace: "nowrap", flexShrink: 0 }}
    >
      <i style={{ flexShrink: 0 }} />
      <span style={{ whiteSpace: "nowrap" }}>{text}</span>
    </span>
  );
}
