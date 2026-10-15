import { useState, useEffect, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  PlusCircle,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import { AncientSelect } from "../common/AncientSelect";
import { AncientNumberInput } from "../common/AncientNumberInput";
import { AncientSearchableSelect } from "../common/AncientSearchableSelect";
import type {
  CreateGiftBoxRequest,
  GameItem,
  GiftBox,
  GiftBoxItem,
  GiftBoxType,
} from "../../types";

interface GiftBoxModalProps {
  isOpen: boolean;
  box: GiftBox | null; // null if creating
  gameOptions: string[];
  availableItems: GameItem[];
  onClose: () => void;
  onSaved: (savedBox: GiftBox) => void;
  onOpenCreateItem: () => void;
  onShowToast: (msg: string) => void;
}

const BOX_TYPE_OPTIONS: { id: GiftBoxType; label: string; desc: string }[] = [
  { id: "fixed", label: "普通固定礼盒", desc: "直接开箱获得配置的全部物品或单一固定物品" },
  { id: "random_prob", label: "随机概率盲盒", desc: "各物品设置独立中奖概率%，模拟真随机权重抽奖" },
  { id: "single_choice", label: "单选自选礼盒", desc: "开启后玩家从候选宝物中挑选 1 项获得" },
  { id: "multi_choice", label: "多选自选礼盒", desc: "开启后玩家从候选宝物中挑选最多 N 项获得" },
];

const RARITY_OPTIONS = ["普通", "稀有", "史诗", "传说"];

export function GiftBoxModal({
  isOpen,
  box,
  gameOptions,
  availableItems,
  onClose,
  onSaved,
  onOpenCreateItem,
  onShowToast,
}: GiftBoxModalProps) {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState("");
  const [game, setGame] = useState("全部游戏");
  const [boxType, setBoxType] = useState<GiftBoxType>("random_prob");
  const [maxChoices, setMaxChoices] = useState(2);
  const [rarity, setRarity] = useState<"普通" | "稀有" | "史诗" | "传说">("史诗");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<GiftBoxItem[]>([]);
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

  // Initialize or reset form
  useEffect(() => {
    if (box) {
      setName(box.name);
      setGame(box.game);
      setBoxType(box.boxType);
      setMaxChoices(box.maxChoices || 2);
      setRarity(box.rarity);
      setDescription(box.description);
      setItems(box.items.map((it) => ({ ...it })));
    } else {
      setName("");
      setGame(gameOptions[0] || "全部游戏");
      setBoxType("random_prob");
      setMaxChoices(2);
      setRarity("史诗");
      setDescription("");
      // Default 3 sample items
      const firstItem = availableItems[0]?.name || "元宝";
      const secondItem = availableItems[1]?.name || "九转金丹";
      const thirdItem = availableItems[2]?.name || "强化神石";
      setItems([
        { itemName: firstItem, category: "通用货币", amount: 1000, probability: 60, rarity: "普通" },
        { itemName: secondItem, category: "修炼丹药", amount: 2, probability: 30, rarity: "稀有" },
        { itemName: thirdItem, category: "锻造材料", amount: 10, probability: 10, rarity: "史诗" },
      ]);
    }
  }, [box, isOpen]);

  if (!isOpen) return null;

  // Calculate probability sum for random_prob
  const totalProbability = items.reduce((acc, it) => acc + (Number(it.probability) || 0), 0);
  const isProbBalanced = Math.abs(totalProbability - 100.0) < 0.01;

  // Handle item change in row
  const handleItemSelect = (index: number, selectedName: string) => {
    const matched = availableItems.find((it) => it.name === selectedName);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        itemName: selectedName,
        category: matched?.category || copy[index].category || "定制道具",
        rarity: (matched?.rarity as any) || copy[index].rarity || "稀有",
      };
      return copy;
    });
  };

  const handleItemAmountChange = (index: number, amt: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].amount = Math.max(1, amt);
      return copy;
    });
  };

  const handleItemProbChange = (index: number, probStr: string) => {
    const prob = parseFloat(probStr) || 0;
    setItems((prev) => {
      const copy = [...prev];
      copy[index].probability = Math.max(0, Math.min(100, prob));
      return copy;
    });
  };

  const handleAddItem = () => {
    const pick = availableItems[items.length % availableItems.length]?.name || "灵石";
    const matched = availableItems.find((it) => it.name === pick);
    setItems((prev) => [
      ...prev,
      {
        itemName: pick,
        category: matched?.category || "常规资源",
        amount: 1,
        probability: 0,
        rarity: (matched?.rarity as any) || "普通",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onShowToast("礼匣内至少须配置 1 项物品");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Evenly distribute probability
  const handleEvenDistributeProb = () => {
    if (items.length === 0) return;
    const avg = parseFloat((100 / items.length).toFixed(1));
    const remainder = parseFloat((100 - avg * items.length).toFixed(1));

    setItems((prev) =>
      prev.map((it, idx) => ({
        ...it,
        probability: idx === 0 ? parseFloat((avg + remainder).toFixed(1)) : avg,
      }))
    );
    onShowToast("已按物品数量自动均分 100% 掉落概率！");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast("请填写礼盒名称");
      return;
    }
    if (items.length === 0) {
      onShowToast("请至少添加一项物品配置");
      return;
    }

    if (boxType === "multi_choice" && (maxChoices < 1 || maxChoices > items.length)) {
      onShowToast(`多选上限须在 1 到 ${items.length} 之间`);
      return;
    }

    setLoading(true);
    const payload: CreateGiftBoxRequest = {
      name: name.trim(),
      game,
      boxType,
      maxChoices: boxType === "multi_choice" ? Number(maxChoices) : 1,
      rarity,
      description: description.trim(),
      items: items.map((it) => ({
        itemName: it.itemName.trim(),
        category: it.category,
        amount: Number(it.amount),
        probability: boxType === "random_prob" ? Number(it.probability) : 0,
        rarity: it.rarity,
      })),
    };

    try {
      let saved: GiftBox;
      if (box) {
        saved = await api.updateGiftBox(box.id, payload);
        onShowToast(`定制礼匣「${saved.name}」已更新！`);
      } else {
        saved = await api.createGiftBox(payload);
        onShowToast(`定制礼匣「${saved.name}」创建成功！`);
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      onShowToast(`保存失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert availableItems to GameItemOption[]
  const selectOptions = availableItems.map((it) => ({
    name: it.name,
    category: it.category,
    description: it.description,
    rarity: it.rarity,
  }));

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={onClose}
      role="presentation"
      style={{ zIndex: 10000 }}
    >
      <div
        className="confirm-dialog"
        style={{
          width: "min(100%, 740px)",
          maxHeight: "min(92vh, 800px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-box-modal-title"
      >
        {/* Fixed Modal Header */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "18px 24px 14px",
            borderBottom: "1px solid #ede8de",
            background: "#fffefa",
            position: "relative",
          }}
        >
          <button className="confirm-close-btn" onClick={onClose} aria-label="关闭" type="button">
            <X size={16} />
          </button>
          <div
            className="confirm-icon-seal"
            style={{
              background: "#edf4f0",
              border: "1px solid #7ea68e",
              boxShadow: "inset 0 0 0 2px rgba(126, 166, 142, 0.12)",
            }}
          >
            <Package size={22} color="#2b5e47" />
          </div>
          <div>
            <h3
              id="gift-box-modal-title"
              style={{
                fontFamily: "Cinzel, STSong, serif",
                fontSize: "16px",
                color: "#1e3328",
                margin: 0,
              }}
            >
              {box ? `编辑定制礼匣 · ${box.name}` : "设计与定制新礼盒 / 礼包"}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#74867b" }}>
              {box
                ? `系统编号：${box.id} · 所属游戏：${box.game} · 支持在线热更新配置`
                : "保存后系统将自动分配全局唯一编号（BOX_xxxxxx），无需手动输入，持久化存储于数据库。"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "1 1 auto",
              overflowY: "auto",
              padding: "18px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Box Basic Properties */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
              <label className="form-field">
                <span>礼匣名称 *</span>
                <input
                  required
                  placeholder="例如：春山限定神兵盲盒、渡劫突破精选匣"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <div className="form-field">
                <span>所属游戏</span>
                <AncientSelect
                  value={game}
                  onChange={setGame}
                  options={gameOptions}
                  ariaLabel="所属游戏"
                />
              </div>

              <div className="form-field">
                <span>礼匣品质</span>
                <AncientSelect
                  value={rarity}
                  onChange={(val) => setRarity(val as any)}
                  options={RARITY_OPTIONS}
                  ariaLabel="礼匣品质"
                />
              </div>
            </div>

            {/* Box Type Selector */}
            <div className="form-field">
              <span>礼盒类型设计 *</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                  marginTop: "4px",
                }}
              >
                {BOX_TYPE_OPTIONS.map((opt) => {
                  const isSelected = boxType === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setBoxType(opt.id)}
                      style={{
                        padding: "7px 10px",
                        border: isSelected ? "2px solid #2d5d4c" : "1px solid #ddd7ca",
                        borderRadius: "2px",
                        background: isSelected ? "#f3f8f5" : "#fffefa",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "12.5px",
                          color: isSelected ? "#244c3e" : "#32443a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {opt.label}
                        {isSelected && <CheckCircle2 size={14} color="#2d5d4c" />}
                      </div>
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "#7e8f84",
                          marginTop: "2px",
                          lineHeight: 1.3,
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* If Multi-Choice: Configure maxChoices */}
            {boxType === "multi_choice" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#fbf6ec",
                  border: "1px solid #ebd7af",
                  borderRadius: "2px",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#825a17" }}>
                    多选上限配置 (maxChoices)
                  </span>
                  <div style={{ fontSize: "11px", color: "#9c7739", marginTop: "2px" }}>
                    玩家开启该礼匣时，最多可从候选宝物中挑选几项（例如配置为 2 即代表 N选2）
                  </div>
                </div>
                <div style={{ width: "120px" }}>
                  <AncientNumberInput
                    min={1}
                    max={Math.max(1, items.length)}
                    value={maxChoices}
                    onChange={setMaxChoices}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <label className="form-field">
              <span>礼匣描述与说明</span>
              <input
                placeholder="例如：开启后获得丰厚渡劫资源，助力少侠飞升通关。"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {/* Divider and Items Configuration Header */}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "14px",
                borderTop: "1px solid #ede8dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "Cinzel, STSong, serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    color: "#22382e",
                  }}
                >
                  开出物品清单配置 ({items.length} 种)
                </span>
                <span style={{ fontSize: "11px", color: "#8a978f", marginLeft: "8px" }}>
                  可自由增减、配置数量与掉落概率
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={onOpenCreateItem}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "#2d5d4c",
                    border: "1px dashed #7fa68e",
                    borderRadius: "2px",
                    background: "#f3f8f5",
                    cursor: "pointer",
                  }}
                >
                  <PlusCircle size={13} /> 录入新物品
                </button>

                {boxType === "random_prob" && items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEvenDistributeProb}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "#825a17",
                      border: "1px solid #ebd7af",
                      borderRadius: "2px",
                      background: "#fbf6ec",
                      cursor: "pointer",
                    }}
                  >
                    <Wand2 size={13} /> 一键均分概率
                  </button>
                )}
              </div>
            </div>

            {/* Probability Status Bar if random_prob */}
            {boxType === "random_prob" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "2px",
                  background: isProbBalanced ? "#f2f8f4" : "#fdf7f2",
                  border: `1px solid ${isProbBalanced ? "#c7ded0" : "#edd8ca"}`,
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isProbBalanced ? (
                    <CheckCircle2 size={15} color="#2b6b4b" />
                  ) : (
                    <AlertCircle size={15} color="#b36449" />
                  )}
                  <span
                    style={{
                      fontWeight: 600,
                      color: isProbBalanced ? "#22563c" : "#944831",
                    }}
                  >
                    当前概率总和: {totalProbability.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: "11px", color: "#8a968e" }}>
                    {isProbBalanced
                      ? "(完美配平 100%)"
                      : `(还差 ${(100 - totalProbability).toFixed(1)}%，建议配平)`}
                  </span>
                </div>

                {/* Mini progress bar */}
                <div
                  style={{
                    width: "100px",
                    height: "8px",
                    background: "#e4dfd4",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, totalProbability)}%`,
                      height: "100%",
                      background: isProbBalanced
                        ? "#2d5d4c"
                        : totalProbability > 100
                        ? "#b34d38"
                        : "#d49a37",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Items Table */}
            <div
              style={{
                border: "1px solid #e2ddd2",
                borderRadius: "2px",
                overflow: "hidden",
                background: "#fbfaf7",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    boxType === "random_prob"
                      ? "2fr 1fr 1fr 36px"
                      : "3fr 1fr 36px",
                  gap: "8px",
                  padding: "8px 12px",
                  background: "#eeeae0",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7d71",
                }}
              >
                <div>物品名称 (从库中检索或自定)</div>
                <div>数量</div>
                {boxType === "random_prob" && <div>掉落概率 (%)</div>}
                <div style={{ textAlign: "center" }}>操作</div>
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto", padding: "6px" }}>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        boxType === "random_prob"
                          ? "2fr 1fr 1fr 36px"
                          : "3fr 1fr 36px",
                      gap: "8px",
                      alignItems: "center",
                      padding: "6px 8px",
                      background: "#fffefa",
                      border: "1px solid #ece8dd",
                      borderRadius: "2px",
                      marginBottom: "6px",
                    }}
                  >
                    <div>
                      <AncientSearchableSelect
                        value={it.itemName}
                        onChange={(val) => handleItemSelect(idx, val)}
                        options={selectOptions}
                        placeholder="检索宝库物品..."
                      />
                    </div>

                    <div>
                      <AncientNumberInput
                        min={1}
                        max={99999}
                        value={it.amount}
                        onChange={(amt) => handleItemAmountChange(idx, amt)}
                      />
                    </div>

                    {boxType === "random_prob" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={it.probability}
                          onChange={(e) => handleItemProbChange(idx, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #dcd7ca",
                            borderRadius: "2px",
                            background: "#fff",
                            fontSize: "12px",
                            textAlign: "right",
                            boxSizing: "border-box",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#8a968e" }}>%</span>
                      </div>
                    )}

                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ab7263",
                          cursor: "pointer",
                          padding: "4px",
                          display: "grid",
                          placeItems: "center",
                        }}
                        title="移除此项"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item button */}
              <div style={{ padding: "8px 12px", background: "#f5f3ec", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    color: "#2d5d4c",
                    border: "1px dashed #7fa68e",
                    borderRadius: "2px",
                    background: "#fffefa",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <Plus size={14} /> 添加掉落物品条目
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Modal Footer */}
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px",
              borderTop: "1px solid #ede8de",
              background: "#faf8f2",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6e7f74", fontWeight: 500 }}>
                {boxType === "random_prob"
                  ? `掉落概率总计: ${totalProbability.toFixed(1)}%`
                  : `内含物品条目: ${items.length} 种`}
              </span>
              {boxType === "random_prob" && !isProbBalanced && (
                <span style={{ fontSize: "11px", color: "#b15d48" }}>
                  (需配平至100%)
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
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
                disabled={loading || !name.trim() || items.length === 0}
                style={{
                  background: "#2d5d4c",
                  borderColor: "#2d5d4c",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "7px 20px",
                }}
              >
                {loading ? "保存中..." : box ? "保存配置更改" : "确认创建定制礼匣"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
