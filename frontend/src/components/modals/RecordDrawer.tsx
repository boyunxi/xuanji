import { Trash2 } from "lucide-react";
import type {
  Announcement,
  Detail,
  Event,
  Order,
  Player,
} from "../../types";
import { money, number } from "../../utils/format";
import { DetailField, Drawer } from "../common/Drawer";
import { StatusBadge } from "../common/StatusBadge";

interface RecordDrawerProps {
  detail: Detail | null;
  onClose: () => void;
  players: Player[];
  events: Event[];
  announcements: Announcement[];
  orders: Order[];
  backendConnected: boolean;
  onTogglePlayerBan: (player: Player) => void;
  onToggleEventStatus: (event: Event) => void;
  onToggleAnnouncementStatus: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onConfirmOrder: (order: Order) => void;
}

export function RecordDrawer({
  detail,
  onClose,
  players,
  events,
  announcements,
  orders,
  backendConnected,
  onTogglePlayerBan,
  onToggleEventStatus,
  onToggleAnnouncementStatus,
  onDeleteAnnouncement,
  onConfirmOrder,
}: RecordDrawerProps) {
  if (!detail) return null;

  if (detail.type === "profile") {
    return (
      <Drawer title="林管理员" subtitle="璇玑 · 运营管理员" onClose={onClose}>
        <div className="detail-section-label">账号资料</div>
        <div className="detail-fields">
          <DetailField label="账号角色">运营管理员</DetailField>
          <DetailField label="所属团队">游戏运营组</DetailField>
          <DetailField label="服务状态">
            <StatusBadge value={backendConnected ? "正常" : "未连接"} />
          </DetailField>
          <DetailField label="后端服务">Go 1.26 HTTP Server</DetailField>
        </div>
      </Drawer>
    );
  }

  if (detail.type === "player") {
    const player = players.find((item) => item.id === detail.id);
    if (!player) return null;
    return (
      <Drawer
        title={player.name}
        subtitle={`玩家编号 ${player.id}`}
        onClose={onClose}
        action={{
          label: player.status === "正常" ? "封禁账号" : "解除封禁",
          danger: player.status === "正常",
          onClick: () => onTogglePlayerBan(player),
        }}
      >
        <div className="detail-section-label">玩家信息</div>
        <div className="detail-fields">
          <DetailField label="账号状态">
            <StatusBadge value={player.status} />
          </DetailField>
          <DetailField label="所属游戏">{player.game}</DetailField>
          <DetailField label="当前等级">Lv.{player.level}</DetailField>
          <DetailField label="累计充值">{money(player.spend)}</DetailField>
          <DetailField label="最近登录">{player.lastActive}</DetailField>
        </div>
        <p className="drawer-tip">修改后将直接通过 Go API 更新至持久化数据库。</p>
      </Drawer>
    );
  }

  if (detail.type === "event") {
    const item = events.find((e) => e.id === detail.id);
    if (!item) return null;
    return (
      <Drawer
        title={item.title}
        subtitle={`活动编号 ${item.id}`}
        onClose={onClose}
        action={
          item.status === "已结束"
            ? undefined
            : {
                label: item.status === "未开始" ? "立即开启" : "结束活动",
                onClick: () => onToggleEventStatus(item),
              }
        }
      >
        <div className="detail-section-label">活动信息</div>
        <div className="detail-fields">
          <DetailField label="当前状态">
            <StatusBadge value={item.status} />
          </DetailField>
          <DetailField label="所属游戏">{item.game}</DetailField>
          <DetailField label="开始时间">{item.start}</DetailField>
          <DetailField label="结束时间">{item.end}</DetailField>
          <DetailField label="参与玩家">{number(item.participants)} 人</DetailField>
        </div>
      </Drawer>
    );
  }

  if (detail.type === "announcement") {
    const item = announcements.find((a) => a.id === detail.id);
    if (!item) return null;
    return (
      <Drawer
        title={item.title}
        subtitle={`公告编号 ${item.id}`}
        onClose={onClose}
        action={{
          label: item.status === "草稿" ? "发布公告" : "撤回为草稿",
          onClick: () => onToggleAnnouncementStatus(item),
        }}
        secondaryAction={{
          label: "删除公告",
          danger: true,
          icon: Trash2,
          onClick: () => onDeleteAnnouncement(item.id),
        }}
      >
        <div className="detail-section-label">公告信息</div>
        <div className="detail-fields">
          <DetailField label="发布状态">
            <StatusBadge value={item.status} />
          </DetailField>
          <DetailField label="所属游戏">{item.game}</DetailField>
          <DetailField label="创建日期">{item.date}</DetailField>
        </div>
        <div className="detail-section-label content-label">公告内容</div>
        <p className="announcement-body">{item.content}</p>
      </Drawer>
    );
  }

  const order = orders.find((o) => o.id === detail.id);
  if (!order) return null;
  return (
    <Drawer
      title={money(order.amount)}
      subtitle={`订单编号 ${order.id}`}
      onClose={onClose}
      action={
        order.status === "处理中"
          ? {
              label: "确认支付成功",
              onClick: () => onConfirmOrder(order),
            }
          : undefined
      }
    >
      <div className="detail-section-label">交易信息</div>
      <div className="detail-fields">
        <DetailField label="订单状态">
          <StatusBadge value={order.status} />
        </DetailField>
        <DetailField label="玩家昵称">{order.player}</DetailField>
        <DetailField label="所属游戏">{order.game}</DetailField>
        <DetailField label="支付方式">{order.method}</DetailField>
        <DetailField label="创建时间">{order.time}</DetailField>
      </div>
    </Drawer>
  );
}
