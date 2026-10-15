import { useState, useEffect, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PlusCircle, Sparkles, X } from "lucide-react";
import { api } from "../../api/client";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import { AncientSelect } from "../common/AncientSelect";
import type { GameItem } from "../../types";

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: GameItem) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_OPTIONS = [
  "通用货币",
  "修炼丹药",
  "锻造材料",
  "极品装备",
  "外观坐骑",
  "特殊定制",
];

const RARITY_OPTIONS = ["普通", "稀有", "史诗", "传说"];

export function CreateItemModal({
  isOpen,
  onClose,
  onCreated,
  onShowToast,
}: CreateItemModalProps) {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("特殊定制");
  const [rarity, setRarity] = useState<"普通" | "稀有" | "史诗" | "传说">("史诗");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const newItem = await api.createItem({
        name: name.trim(),
        category,
        rarity,
        description: description.trim(),
      });
      onShowToast(`新定制道具「${newItem.name}」已成功录入数据库！`);
      onCreated(newItem);
      onClose();
      // Reset form
      setName("");
      setDescription("");
    } catch (err: any) {
      onShowToast(`道具录入失败: ${err.message}`);
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
        style={{ width: "min(100%, 480px)" }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-item-title"
      >
        <button
          className="confirm-close-btn"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={16} />
        </button>

        <div className="confirm-body" style={{ paddingBottom: "16px" }}>
          <div className="confirm-icon-seal info" style={{ background: "#edf5f1", borderColor: "#7fa68d" }}>
            <Sparkles size={20} color="#2b5e4c" />
          </div>
          <div>
            <h3 id="create-item-title" style={{ fontFamily: "Cinzel, STSong, serif", fontSize: "16px", color: "#22382e", margin: 0 }}>
              录入定制新道具
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#7a8a7f" }}>
              添加全新物品资源至全局数据库，可供礼盒定制与GM发放调配。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 26px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label className="form-field">
              <span>道具名称 *</span>
              <input
                required
                autoFocus
                placeholder="例如：太虚玄火令、鸿蒙造化丹"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-field">
                <span>所属类别</span>
                <AncientSelect
                  value={category}
                  onChange={setCategory}
                  options={CATEGORY_OPTIONS}
                  ariaLabel="所属类别"
                />
              </div>

              <div className="form-field">
                <span>道具品质</span>
                <AncientSelect
                  value={rarity}
                  onChange={(val) => setRarity(val as any)}
                  options={RARITY_OPTIONS}
                  ariaLabel="道具品质"
                />
              </div>
            </div>

            <label className="form-field">
              <span>道具效用 / 描述说明</span>
              <textarea
                rows={3}
                placeholder="描述该道具在游戏内的功能效用与产出背景..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #dcd7ca",
                  borderRadius: "2px",
                  background: "#fffefa",
                  fontSize: "12px",
                  color: "#2a3b32",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
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
              disabled={loading || !name.trim()}
              style={{
                background: "#2d5d4c",
                borderColor: "#2d5d4c",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <PlusCircle size={14} />
              {loading ? "录入中..." : "确认录入数据库"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
