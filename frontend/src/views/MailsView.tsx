import { useState } from "react";
import {
  AlertTriangle,
  Gift,
  Mail,
  MailCheck,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmModal } from "../components/common/ConfirmModal";
import type { Game, Mail as MailType } from "../types";

interface MailsViewProps {
  mails: MailType[];
  game: Game;
  onCompose: () => void;
  onRecall: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectDetail: (id: string) => void;
  loading: boolean;
}

export function MailsView({
  mails,
  game,
  onCompose,
  onRecall,
  onDelete,
  onSelectDetail,
  loading,
}: MailsViewProps) {
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [query, setQuery] = useState("");
  const [recallingMail, setRecallingMail] = useState<any>(null);
  const [deletingMail, setDeletingMail] = useState<any>(null);

  const normalizedMails = mails.map((m: any) => ({
    id: m.id || m.ID || "",
    title: m.title || m.Title || "",
    content: m.content || m.Content || "",
    sender: m.sender || m.Sender || "璇玑运营司",
    game: m.game || m.Game || "全部游戏",
    targetType: m.targetType || m.TargetType || "all",
    targetId: m.targetId || m.TargetID || "ALL",
    minLevel: m.minLevel ?? m.MinLevel ?? 1,
    status: m.status || m.Status || "已发送",
    attachments: (m.attachments || m.Attachments || []).map((a: any) => ({
      itemId: a.itemId || a.ItemID || "",
      itemName: a.itemName || a.ItemName || "",
      category: a.category || a.Category || "通用道具",
      amount: a.amount ?? a.Amount ?? 1,
      rarity: a.rarity || a.Rarity || "普通",
      isBox: a.isBox ?? a.IsBox ?? false,
    })),
    sentAt: m.sentAt || m.SentAt || "",
    expiresAt: m.expiresAt || m.ExpiresAt || "",
    claimedCount: m.claimedCount ?? m.ClaimedCount ?? 0,
    totalTarget: m.totalTarget ?? m.TotalTarget ?? 0,
  }));

  // Filtered mails
  const filteredMails = normalizedMails.filter((m) => {
    if (game !== "全部游戏" && m.game !== "全部游戏" && m.game !== game) return false;
    if (statusFilter !== "全部状态" && m.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchTarget = m.targetId.toLowerCase().includes(q);
      const matchContent = m.content.toLowerCase().includes(q);
      const matchSender = m.sender.toLowerCase().includes(q);
      if (!matchTitle && !matchTarget && !matchContent && !matchSender) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalMails = normalizedMails.length;
  const sentMails = normalizedMails.filter((m) => m.status === "已发送").length;
  const totalClaimed = normalizedMails.reduce((acc, m) => acc + (m.claimedCount || 0), 0);
  const totalAttachments = normalizedMails.reduce(
    (acc, m) => acc + m.attachments.reduce((sum: number, a: any) => sum + a.amount, 0),
    0
  );

  return (
    <div className="mails-view">
      {/* KPI Stats Strip */}
      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">累计发放信函</span>
            <Mail size={16} className="text-[#2d5d4c]" />
          </div>
          <div className="metric-value">
            {totalMails} <small className="metric-unit">封</small>
          </div>
          <div className="metric-change positive">已发送 {sentMails} 封</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">全服群发补偿</span>
            <Users size={16} className="text-[#2d5d4c]" />
          </div>
          <div className="metric-value">
            {mails.filter((m) => m.TargetType === "all").length}{" "}
            <small className="metric-unit">批次</small>
          </div>
          <div className="metric-change neutral">普惠全区服道友</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">累计被领取人次</span>
            <MailCheck size={16} className="text-[#2d5d4c]" />
          </div>
          <div className="metric-value">
            {totalClaimed.toLocaleString()} <small className="metric-unit">人次</small>
          </div>
          <div className="metric-change positive">活跃领奖闭环</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">附件物资总吞吐</span>
            <Gift size={16} className="text-[#2d5d4c]" />
          </div>
          <div className="metric-value">
            {totalAttachments.toLocaleString()} <small className="metric-unit">件</small>
          </div>
          <div className="metric-change neutral">元宝、灵药与神兵</div>
        </div>
      </div>

      {/* Mails Table Panel */}
      <div className="table-panel">
        {/* Toolbar & Filters */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="搜索信函标题、玩家ID、正文关键词..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              {["全部状态", "已发送", "草稿", "已撤回"].map((st) => (
                <button
                  key={st}
                  className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-right">
            <button className="primary-button" onClick={onCompose} style={{ height: 36, padding: "0 16px", fontSize: 12.5 }}>
              <Plus size={15} />
              <span>起草补偿信函</span>
            </button>
          </div>
        </div>

        {/* Mails Table */}
        <div className="table-scroll">
          <table className="ancient-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>信函编号</th>
              <th>信题与发件署名</th>
              <th style={{ width: 100 }}>所属游戏</th>
              <th style={{ width: 130 }}>送达对象</th>
              <th>挂载附件物资</th>
              <th style={{ width: 140 }}>领取进展</th>
              <th style={{ width: 150 }}>发件时间</th>
              <th style={{ width: 80 }}>状态</th>
              <th style={{ width: 130, textAlign: "right" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 30 }}>
                      <RefreshCw size={16} className="animate-spin text-[#2d5d4c]" />
                      <span>正在检索信函数据...</span>
                    </div>
                  ) : (
                    "暂无符合条件的补偿信函记录"
                  )}
                </td>
              </tr>
            ) : (
              filteredMails.map((mail) => {
                const claimPercent =
                  mail.totalTarget > 0
                    ? Math.min(100, Math.round((mail.claimedCount / mail.totalTarget) * 100))
                    : 0;

                return (
                  <tr key={mail.id} className="ancient-table-row">
                    <td>
                      <span className="mono-id">{mail.id.replace("MAIL_", "")}</span>
                    </td>
                    <td>
                      <div
                        className="clickable-title"
                        onClick={() => onSelectDetail(mail.id)}
                        title="点击查看完整信函信笺与附件"
                      >
                        <strong>{mail.title}</strong>
                        <div className="mail-sub-sender">
                          <span>落款：{mail.sender}</span>
                          {mail.minLevel > 1 && (
                            <span className="level-badge">≥ Lv.{mail.minLevel}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="game-tag">{mail.game}</span>
                    </td>
                    <td>
                      {mail.targetType === "all" ? (
                        <span className="target-pill all">
                          <Users size={12} /> 全服道友
                        </span>
                      ) : (
                        <span className="target-pill player" title={`指定玩家: ${mail.targetId}`}>
                          <Mail size={12} /> {mail.targetId}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="mail-attachments-preview">
                        {mail.attachments.length === 0 ? (
                          <span className="text-gray-400 text-xs">无物资附件</span>
                        ) : (
                          mail.attachments.slice(0, 2).map((att: any, idx: number) => (
                            <span key={idx} className={`att-tag ${att.rarity}`}>
                              {att.isBox && <Package size={11} style={{ marginRight: 2 }} />}
                              {att.itemName} ×{att.amount.toLocaleString()}
                            </span>
                          ))
                        )}
                        {mail.attachments.length > 2 && (
                          <span className="att-tag more">+{mail.attachments.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {mail.status === "已发送" ? (
                        <div className="claim-progress-box">
                          <div className="claim-counts">
                            <span>{mail.claimedCount.toLocaleString()}</span>
                            <span className="text-gray-400">/ {mail.totalTarget.toLocaleString()}</span>
                          </div>
                          <div className="ancient-progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${claimPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">未开启领取</span>
                      )}
                    </td>
                    <td>
                      <div className="time-cell">
                        <span>{mail.sentAt.split(" ")[0]}</span>
                        <small className="text-gray-400">{mail.sentAt.split(" ")[1] || ""}</small>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={mail.status as any} />
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="row-actions" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                        <button
                          className="action-link"
                          onClick={() => onSelectDetail(mail.id)}
                          title="查看信笺详情"
                        >
                          详情
                        </button>

                        {mail.status === "已发送" && (
                          <button
                            className="action-link text-[#b83b26]"
                            onClick={() => setRecallingMail(mail)}
                            title="紧急撤回此邮件（未领取的玩家将无法继续领取）"
                          >
                            撤回
                          </button>
                        )}

                        {(mail.status === "草稿" || mail.status === "已撤回") && (
                          <button
                            className="action-link text-gray-400 hover:text-red-600"
                            onClick={() => setDeletingMail(mail)}
                            title="删除此邮件记录"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Confirm Recall Modal */}
      {recallingMail && (
        <ConfirmModal
          isOpen={true}
          title="紧急撤回补偿信函"
          content={`确定要撤回信函「${recallingMail.title}」吗？撤回后，全服尚未领取的玩家将立即无法继续领取其中的物资附件。`}
          confirmText="确认撤回"
          cancelText="放弃"
          danger={true}
          onConfirm={async () => {
            await onRecall(recallingMail.id);
            setRecallingMail(null);
          }}
          onClose={() => setRecallingMail(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMail && (
        <ConfirmModal
          isOpen={true}
          title="删除信函记录"
          content={`确定要永久删除信函「${deletingMail.title}」吗？此操作无法撤销。`}
          confirmText="确认删除"
          cancelText="取消"
          danger={true}
          onConfirm={async () => {
            await onDelete(deletingMail.id);
            setDeletingMail(null);
          }}
          onClose={() => setDeletingMail(null)}
        />
      )}
    </div>
  );
}
