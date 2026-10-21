import { useState } from "react";
import {
  AlertCircle,
  Gift,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
  X,
  Package,
  Sparkles,
} from "lucide-react";
import { AncientSelect } from "../common/AncientSelect";
import { AncientNumberInput } from "../common/AncientNumberInput";
import { games } from "../../constants/navigation";
import { predefinedGameItems } from "../../constants/gameItems";
import type { CreateMailRequest, Game, GameItem, GiftBox, MailAttachment, Player } from "../../types";

interface ComposeMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMailRequest) => Promise<void>;
  currentGame: Game;
  players: Player[];
  giftBoxes?: GiftBox[];
  availableItems?: GameItem[];
}

export function ComposeMailModal({
  isOpen,
  onClose,
  onSubmit,
  currentGame,
  players,
  giftBoxes = [],
  availableItems = predefinedGameItems as any,
}: ComposeMailModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sender, setSender] = useState("璇玑运营司");
  const [game, setGame] = useState<string>(currentGame === "全部游戏" ? "全部游戏" : currentGame);
  const [targetType, setTargetType] = useState<"all" | "player">("all");
  const [targetId, setTargetId] = useState("");
  const [minLevel, setMinLevel] = useState(1);
  const [expireDays, setExpireDays] = useState(7);
  const [attachments, setAttachments] = useState<MailAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New attachment selector state
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<"item" | "box">("item");
  const [selectedItemName, setSelectedItemName] = useState(availableItems[0]?.name || "元宝");
  const [selectedBoxId, setSelectedBoxId] = useState(giftBoxes[0]?.id || "");
  const [attachmentAmount, setAttachmentAmount] = useState(1);

  if (!isOpen) return null;

  const handleAddAttachment = () => {
    if (selectedItemType === "item") {
      const item = availableItems.find((i) => i.name === selectedItemName) || availableItems[0];
      if (!item) return;
      setAttachments([
        ...attachments,
        {
          itemId: item.id || `ITEM_${Date.now()}`,
          itemName: item.name,
          category: item.category,
          amount: attachmentAmount > 0 ? attachmentAmount : 1,
          rarity: (item.rarity as any) || "普通",
          isBox: false,
        },
      ]);
    } else {
      const box = giftBoxes.find((b) => b.id === selectedBoxId) || giftBoxes[0];
      if (!box) return;
      setAttachments([
        ...attachments,
        {
          itemId: box.id,
          itemName: box.name,
          category: "定制礼匣",
          amount: attachmentAmount > 0 ? attachmentAmount : 1,
          rarity: box.rarity || "传说",
          isBox: true,
        },
      ]);
    }

    setIsAddingAttachment(false);
    setAttachmentAmount(1);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async (isDraft: boolean) => {
    if (!title.trim()) {
      setError("邮件标题不可为空");
      return;
    }
    if (!content.trim()) {
      setError("邮件正文不可为空");
      return;
    }
    if (targetType === "player" && !targetId.trim()) {
      setError("请指定接收邮件的目标玩家");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        sender: sender.trim() || "璇玑运营司",
        game,
        targetType,
        targetId: targetType === "all" ? "ALL" : targetId.trim(),
        minLevel,
        expireDays,
        attachments,
        isDraft,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "下发邮件失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ancient-modal-backdrop" onClick={onClose}>
      <div
        className="ancient-modal-card compose-mail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, width: "95%" }}
      >
        {/* Header */}
        <div className="ancient-modal-header">
          <div className="ancient-modal-title-wrap">
            <span className="ancient-seal-small">函</span>
            <div>
              <h3>起草运营补偿信函</h3>
              <p>全服公告补偿 · 定向物资特派 · 复合道具附件下发</p>
            </div>
          </div>
          <button className="ancient-modal-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="ancient-alert-danger" style={{ margin: "16px 24px 0" }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="ancient-modal-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "20px 24px" }}>
          {/* Row 1: Title & Game */}
          <div className="form-grid-2">
            <div className="ancient-form-item">
              <label>邮件标题 *</label>
              <input
                type="text"
                className="ancient-input"
                placeholder="例: 全服停服例行维护补偿与致歉函"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="ancient-form-item">
              <label>所属游戏</label>
              <AncientSelect
                value={game}
                onChange={(v) => setGame(v)}
                options={games.map((g) => ({ value: g, label: g }))}
              />
            </div>
          </div>

          {/* Row 2: Sender & Target Type */}
          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div className="ancient-form-item">
              <label>发件落款署名</label>
              <input
                type="text"
                className="ancient-input"
                placeholder="例: 璇玑运营司"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              />
            </div>
            <div className="ancient-form-item">
              <label>送达范围</label>
              <div className="target-type-toggle">
                <button
                  type="button"
                  className={`target-btn ${targetType === "all" ? "active" : ""}`}
                  onClick={() => setTargetType("all")}
                >
                  <Users size={14} /> 全服道友群发
                </button>
                <button
                  type="button"
                  className={`target-btn ${targetType === "player" ? "active" : ""}`}
                  onClick={() => setTargetType("player")}
                >
                  <Mail size={14} /> 定向特派玩家
                </button>
              </div>
            </div>
          </div>

          {/* If targeted to player */}
          {targetType === "player" && (
            <div className="ancient-form-item" style={{ marginTop: 14 }}>
              <label>接收玩家 (选择或直接输入玩家ID/名称) *</label>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  className="ancient-input"
                  placeholder="请输入或从右侧挑选玩家ID (如: XJ100689)"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  className="ancient-input"
                  style={{ width: 180 }}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">-- 快速挑选玩家 --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) - Lv.{p.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Row 3: Minimum Level & Expiry */}
          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div className="ancient-form-item">
              <label>领取最低门槛等级 (≥ Lv)</label>
              <AncientNumberInput
                value={minLevel}
                onChange={(v) => setMinLevel(v)}
                min={1}
                max={200}
              />
            </div>
            <div className="ancient-form-item">
              <label>信函有效留存天数 (天)</label>
              <AncientSelect
                value={String(expireDays)}
                onChange={(v) => setExpireDays(Number(v))}
                options={[
                  { value: "3", label: "3 天 (紧急时效)" },
                  { value: "7", label: "7 天 (标准时效)" },
                  { value: "14", label: "14 天 (两周保存)" },
                  { value: "30", label: "30 天 (长期保存)" },
                ]}
              />
            </div>
          </div>

          {/* Content */}
          <div className="ancient-form-item" style={{ marginTop: 14 }}>
            <label>信函正文内容 *</label>
            <textarea
              className="ancient-input"
              rows={4}
              placeholder="请输入诚挚的补偿信函正文，说明事由、补偿明细与祝福语..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Attachments Section */}
          <div className="mail-attachments-section" style={{ marginTop: 18 }}>
            <div className="attachments-header">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Gift size={16} className="text-[#2d5d4c]" />
                <strong style={{ fontSize: 13.5, color: "#1c352f" }}>
                  信函挂载物资附件 ({attachments.length})
                </strong>
              </div>
              {!isAddingAttachment && (
                <button
                  type="button"
                  className="add-attachment-trigger"
                  onClick={() => setIsAddingAttachment(true)}
                >
                  <Plus size={14} /> 添加附件物资
                </button>
              )}
            </div>

            {/* List of current attachments */}
            {attachments.length === 0 ? (
              <div className="attachments-empty-tip">
                暂未挂载任何附件物资（玩家开信后仅查看纯文本信函）
              </div>
            ) : (
              <div className="attachments-pill-list">
                {attachments.map((att, idx) => (
                  <div key={idx} className="attachment-pill">
                    <span className={`pill-rarity-badge ${att.rarity}`}>
                      {att.rarity}
                    </span>
                    <span className="pill-name">
                      {att.isBox && <Package size={12} style={{ display: "inline", marginRight: 4 }} />}
                      {att.itemName}
                    </span>
                    <span className="pill-amount">× {att.amount.toLocaleString()}</span>
                    <button
                      type="button"
                      className="pill-remove-btn"
                      onClick={() => handleRemoveAttachment(idx)}
                      title="移除此附件"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-form to add attachment */}
            {isAddingAttachment && (
              <div className="attachment-add-card">
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    className={`sub-tab-btn ${selectedItemType === "item" ? "active" : ""}`}
                    onClick={() => setSelectedItemType("item")}
                  >
                    <Sparkles size={13} /> 通用游戏道具
                  </button>
                  {giftBoxes.length > 0 && (
                    <button
                      type="button"
                      className={`sub-tab-btn ${selectedItemType === "box" ? "active" : ""}`}
                      onClick={() => setSelectedItemType("box")}
                    >
                      <Package size={13} /> 定制礼匣盲盒
                    </button>
                  )}
                </div>

                <div className="form-grid-2">
                  {selectedItemType === "item" ? (
                    <div className="ancient-form-item">
                      <label>选择道具</label>
                      <AncientSelect
                        value={selectedItemName}
                        onChange={(v) => {
                          setSelectedItemName(v);
                          if (v === "元宝" || v === "灵石") setAttachmentAmount(1000);
                        }}
                        options={availableItems.map((i) => ({
                          value: i.name,
                          label: `${i.name} (${i.category} · ${i.rarity})`,
                        }))}
                      />
                    </div>
                  ) : (
                    <div className="ancient-form-item">
                      <label>选择礼匣</label>
                      <AncientSelect
                        value={selectedBoxId}
                        onChange={(v) => setSelectedBoxId(v)}
                        options={giftBoxes.map((b) => ({
                          value: b.id,
                          label: `${b.name} (${b.rarity} · ${b.boxType})`,
                        }))}
                      />
                    </div>
                  )}

                  <div className="ancient-form-item">
                    <label>挂载数量</label>
                    <AncientNumberInput
                      value={attachmentAmount}
                      onChange={(v) => setAttachmentAmount(v)}
                      min={1}
                      max={1000000}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="ancient-btn-secondary"
                    onClick={() => setIsAddingAttachment(false)}
                    style={{ padding: "6px 12px", fontSize: 12.5 }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="ancient-btn-primary"
                    onClick={handleAddAttachment}
                    style={{ padding: "6px 14px", fontSize: 12.5 }}
                  >
                    确认挂入
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ancient-modal-footer">
          <button
            type="button"
            className="ancient-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="button"
            className="ancient-btn-secondary"
            onClick={() => handleSend(true)}
            disabled={loading}
            style={{ borderColor: "#cbd5c8" }}
          >
            存为草稿
          </button>
          <button
            type="button"
            className="ancient-btn-primary"
            onClick={() => handleSend(false)}
            disabled={loading}
          >
            {loading ? "正在印发下发..." : "签印下发全服"}
          </button>
        </div>
      </div>
    </div>
  );
}
