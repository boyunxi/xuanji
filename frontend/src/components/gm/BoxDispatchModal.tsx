import { useState, type FormEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { Package, Send, X } from "lucide-react";
import { api } from "../../api/client";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import { AncientNumberInput } from "../common/AncientNumberInput";
import type { GiftBox, Player } from "../../types";

interface BoxDispatchModalProps {
  isOpen: boolean;
  box: GiftBox | null;
  players: Player[];
  onClose: () => void;
  onDispatched: () => void;
  onShowToast: (msg: string) => void;
}

export function BoxDispatchModal({
  isOpen,
  box,
  players,
  onClose,
  onDispatched,
  onShowToast,
}: BoxDispatchModalProps) {
  useBodyScrollLock(isOpen);

  const [playerId, setPlayerId] = useState("");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("运营礼匣特供投放");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (players.length > 0 && !playerId) {
      setPlayerId(players[0].id);
    }
  }, [players, playerId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !box) return null;

  const boxTypeLabel = (() => {
    switch (box.boxType) {
      case "fixed":
        return "普通固定礼匣";
      case "random_prob":
        return "随机概率盲盒";
      case "single_choice":
        return "单选自选礼匣";
      case "multi_choice":
        return `多选自选礼匣(${box.items.length}选${box.maxChoices})`;
    }
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!playerId.trim()) return;

    setLoading(true);
    try {
      await api.dispatchGiftBox(box.id, {
        playerId: playerId.trim(),
        amount: Number(amount),
        reason: reason.trim(),
      });
      onShowToast(`成功向玩家 [${playerId}] 发放「${box.name}」x${amount}！`);
      onDispatched();
      onClose();
    } catch (err: any) {
      onShowToast(`礼匣发放失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={onClose}
      role="presentation"
      style={{ zIndex: 10000 }}
    >
      <div
        className="confirm-dialog"
        style={{ width: "min(100%, 500px)" }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-box-title"
      >
        <button className="confirm-close-btn" onClick={onClose} aria-label="关闭">
          <X size={16} />
        </button>

        <div className="confirm-body" style={{ paddingBottom: "14px" }}>
          <div className="confirm-icon-seal info" style={{ background: "#edf3f6", borderColor: "#7b9fae" }}>
            <Package size={22} color="#2b5266" />
          </div>
          <div>
            <h3
              id="dispatch-box-title"
              style={{ fontFamily: "Cinzel, STSong, serif", fontSize: "16px", color: "#1e3328", margin: 0 }}
            >
              向玩家投放定制礼匣
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#77877d" }}>
              选定玩家并指定数量，礼匣将直接发送至玩家游戏背包或游戏邮箱中。
            </p>
          </div>
        </div>

        {/* Box Summary Card */}
        <div
          style={{
            margin: "0 26px 16px",
            padding: "12px 14px",
            background: "#f8f6f0",
            border: "1px solid #e5dfd2",
            borderRadius: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#22382e" }}>{box.name}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 6px",
                  background: "#2d5d4c",
                  color: "#fff",
                  borderRadius: "2px",
                }}
              >
                {boxTypeLabel}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#8a968d", marginTop: "4px" }}>
              所属游戏: {box.game} · 内含配置物资 {box.items.length} 种 · 品质: {box.rarity}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 26px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label className="form-field">
              <span>目标玩家 ID / 角色编号 *</span>
              <input
                required
                placeholder="例如：XJ100248"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
              />
            </label>

            {/* Quick Player Select Chips */}
            {players.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#86948b" }}>快捷填入玩家:</span>
                {players.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlayerId(p.id)}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      border: "1px solid #dcd8cc",
                      borderRadius: "2px",
                      background: playerId === p.id ? "#2d5d4c" : "#fffefa",
                      color: playerId === p.id ? "#fff" : "#45594e",
                      cursor: "pointer",
                    }}
                  >
                    {p.name} ({p.id})
                  </button>
                ))}
              </div>
            )}

            <div className="form-field">
              <span>发放礼匣数量</span>
              <AncientNumberInput
                min={1}
                max={999}
                value={amount}
                onChange={setAmount}
              />
            </div>

            <label className="form-field">
              <span>发放原因说明</span>
              <input
                required
                placeholder="例如：运营活动定制福利、测试开箱体验"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid #eeeae0",
            }}
          >
            <button
              type="button"
              className="confirm-btn cancel"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="confirm-btn primary"
              disabled={loading || !playerId.trim()}
              style={{
                background: "#2d5d4c",
                borderColor: "#2d5d4c",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={14} />
              {loading ? "发放中..." : "确认发放至玩家"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
