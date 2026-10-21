import { Trash2, Undo2, Package, Gift, Ticket, Layers, Sparkles } from "lucide-react";
import type {
  Announcement,
  CDKeyBatch,
  Detail,
  Event,
  Mail,
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
  mails?: Mail[];
  cdkeyBatches?: CDKeyBatch[];
  backendConnected: boolean;
  onTogglePlayerBan: (player: Player) => void;
  onToggleEventStatus: (event: Event) => void;
  onToggleAnnouncementStatus: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onConfirmOrder: (order: Order) => void;
  onRecallMail?: (id: string) => void;
  onDeleteMail?: (id: string) => void;
}

export function RecordDrawer({
  detail,
  onClose,
  players,
  events,
  announcements,
  orders,
  mails = [],
  cdkeyBatches = [],
  backendConnected,
  onTogglePlayerBan,
  onToggleEventStatus,
  onToggleAnnouncementStatus,
  onDeleteAnnouncement,
  onConfirmOrder,
  onRecallMail,
  onDeleteMail,
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

  if (detail.type === "mail") {
    const mail = mails.find((m) => m.ID === detail.id);
    if (!mail) return null;
    return (
      <Drawer
        title={mail.Title}
        subtitle={`信函编号 ${mail.ID}`}
        onClose={onClose}
        action={
          mail.Status === "已发送" && onRecallMail
            ? {
                label: "紧急撤回信函",
                danger: true,
                icon: Undo2,
                onClick: () => {
                  onRecallMail(mail.ID);
                  onClose();
                },
              }
            : undefined
        }
        secondaryAction={
          (mail.Status === "草稿" || mail.Status === "已撤回") && onDeleteMail
            ? {
                label: "删除信函记录",
                danger: true,
                icon: Trash2,
                onClick: () => {
                  onDeleteMail(mail.ID);
                  onClose();
                },
              }
            : undefined
        }
      >
        <div className="detail-section-label">信函信息</div>
        <div className="detail-fields">
          <DetailField label="信函状态">
            <StatusBadge value={mail.Status as any} />
          </DetailField>
          <DetailField label="所属游戏">{mail.Game}</DetailField>
          <DetailField label="发件署名">{mail.Sender}</DetailField>
          <DetailField label="送达对象">
            {mail.TargetType === "all" ? "全服道友群发" : `定向特派 (${mail.TargetID})`}
          </DetailField>
          <DetailField label="境界限制">
            {mail.MinLevel > 1 ? `≥ Lv.${mail.MinLevel}` : "无门槛 (Lv.1+)"}
          </DetailField>
          <DetailField label="发送时间">{mail.SentAt}</DetailField>
          <DetailField label="有效截止">{mail.ExpiresAt}</DetailField>
          <DetailField label="领取人次">
            {mail.Status === "已发送"
              ? `${mail.ClaimedCount.toLocaleString()} / ${mail.TotalTarget.toLocaleString()} 人次`
              : "未生效"}
          </DetailField>
        </div>

        <div className="detail-section-label content-label">信函正文</div>
        <div
          className="announcement-body"
          style={{
            background: "#faf8f2",
            border: "1px solid #e8e2d4",
            padding: "14px 16px",
            borderRadius: 6,
            lineHeight: 1.7,
            color: "#283e35",
          }}
        >
          {mail.Content}
        </div>

        <div className="detail-section-label content-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={14} className="text-[#2d5d4c]" />
          <span>挂载物资附件 ({mail.Attachments.length})</span>
        </div>

        {mail.Attachments.length === 0 ? (
          <p className="text-gray-400 text-xs" style={{ margin: "4px 0" }}>无附件物资</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {mail.Attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 6,
                  background: "#fdfbf7",
                  border: "1px solid #e5ded0",
                  fontSize: 12.5,
                }}
              >
                <span className={`pill-rarity-badge ${att.rarity}`} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3 }}>
                  {att.rarity}
                </span>
                <span style={{ fontWeight: 600, color: "#1c352f" }}>
                  {att.isBox && <Package size={12} style={{ display: "inline", marginRight: 4 }} />}
                  {att.ItemName}
                </span>
                <span style={{ color: "#2d5d4c", fontWeight: 700 }}>
                  × {att.Amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    );
  }

  if (detail.type === "cdkey") {
    const batch = cdkeyBatches.find((b: any) => (b.id || b.ID) === detail.id);
    if (!batch) return null;
    const b: any = {
      id: batch.id || (batch as any).ID || "",
      name: batch.name || (batch as any).Name || "",
      type: batch.type || (batch as any).Type || "universal",
      code: batch.code || (batch as any).Code || "",
      game: batch.game || (batch as any).Game || "全部游戏",
      minLevel: batch.minLevel ?? (batch as any).MinLevel ?? 1,
      totalCount: batch.totalCount ?? (batch as any).TotalCount ?? 1,
      usedCount: batch.usedCount ?? (batch as any).UsedCount ?? 0,
      status: batch.status || (batch as any).Status || "已启用",
      expiresAt: batch.expiresAt || (batch as any).ExpiresAt || "",
      description: batch.description || (batch as any).Description || "",
      rewards: (batch.rewards || (batch as any).Rewards || []).map((rw: any) => ({
        itemName: rw.itemName || rw.ItemName || "",
        amount: rw.amount ?? rw.Amount ?? 1,
        rarity: rw.rarity || rw.Rarity || "普通",
        isBox: rw.isBox ?? rw.IsBox ?? false,
      })),
    };

    return (
      <Drawer
        title={b.name}
        subtitle={b.type === "universal" ? `通用兑换码 · ${b.code}` : `批量独占卡密 · ${b.id}`}
        onClose={onClose}
      >
        <div className="detail-section-label">批次信息</div>
        <div className="detail-fields">
          <DetailField label="批次状态">
            <StatusBadge value={b.status} />
          </DetailField>
          <DetailField label="兑换码类型">
            {b.type === "universal" ? "通用福利码 (一码多兑)" : "批量独占卡密 (一码一兑)"}
          </DetailField>
          {b.type === "universal" && <DetailField label="通用兑换码">{b.code}</DetailField>}
          <DetailField label="所属游戏">{b.game}</DetailField>
          <DetailField label="等级门槛">
            {b.minLevel > 1 ? `≥ Lv.${b.minLevel}` : "无门槛 (Lv.1+)"}
          </DetailField>
          <DetailField label="有效截止">{b.expiresAt}</DetailField>
          <DetailField label="兑换进度">
            {b.usedCount} / {b.totalCount} 次
          </DetailField>
        </div>

        {b.description && (
          <>
            <div className="detail-section-label content-label">批次说明</div>
            <p
              className="announcement-body"
              style={{
                background: "#faf8f2",
                border: "1px solid #e8e2d4",
                padding: "10px 14px",
                borderRadius: 6,
                fontSize: 13,
                lineHeight: 1.6,
                color: "#283e35",
              }}
            >
              {b.description}
            </p>
          </>
        )}

        <div className="detail-section-label content-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={14} className="text-[#2d5d4c]" />
          <span>绑定礼包物资 ({b.rewards.length})</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {b.rewards.map((rw: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 6,
                background: "#fdfbf7",
                border: "1px solid #e5ded0",
                fontSize: 12.5,
              }}
            >
              <span className={`pill-rarity-badge ${rw.rarity}`} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3 }}>
                {rw.rarity}
              </span>
              <span style={{ fontWeight: 600, color: "#1c352f" }}>
                {rw.isBox && <Package size={12} style={{ display: "inline", marginRight: 4 }} />}
                {rw.itemName}
              </span>
              <span style={{ color: "#2d5d4c", fontWeight: 700 }}>
                × {rw.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
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
