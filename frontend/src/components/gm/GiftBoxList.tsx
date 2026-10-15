import { useState, useMemo } from "react";
import {
  Edit3,
  Package,
  Plus,
  PlusCircle,
  Power,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "../../api/client";
import { AncientSelect } from "../common/AncientSelect";
import { ConfirmModal } from "../common/ConfirmModal";
import type { GiftBox } from "../../types";

interface GiftBoxListProps {
  giftBoxes: GiftBox[];
  gameOptions: string[];
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (box: GiftBox) => void;
  onOpenSimulator: (box: GiftBox) => void;
  onOpenDispatch: (box: GiftBox) => void;
  onOpenCreateItem: () => void;
  onShowToast: (msg: string) => void;
}

const TYPE_FILTER_OPTIONS = [
  "全部类型",
  "普通固定",
  "随机概率",
  "单选自选",
  "多选自选",
];

const STATUS_FILTER_OPTIONS = ["全部状态", "已启用", "已下架"];

export function GiftBoxList({
  giftBoxes,
  gameOptions,
  onRefresh,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenSimulator,
  onOpenDispatch,
  onOpenCreateItem,
  onShowToast,
}: GiftBoxListProps) {
  const [selectedGame, setSelectedGame] = useState("全部游戏");
  const [selectedType, setSelectedType] = useState("全部类型");
  const [selectedStatus, setSelectedStatus] = useState("全部状态");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingBox, setDeletingBox] = useState<GiftBox | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter boxes
  const filteredBoxes = useMemo(() => {
    return giftBoxes.filter((b) => {
      if (selectedGame !== "全部游戏" && b.game !== "全部游戏" && b.game !== selectedGame) {
        return false;
      }
      if (selectedType !== "全部类型") {
        if (selectedType === "普通固定" && b.boxType !== "fixed") return false;
        if (selectedType === "随机概率" && b.boxType !== "random_prob") return false;
        if (selectedType === "单选自选" && b.boxType !== "single_choice") return false;
        if (selectedType === "多选自选" && b.boxType !== "multi_choice") return false;
      }
      if (selectedStatus !== "全部状态" && b.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const idMatch = b.id.toLowerCase().includes(q);
        const nameMatch = b.name.toLowerCase().includes(q);
        const descMatch = b.description.toLowerCase().includes(q);
        const itemMatch = b.items.some((it) => it.itemName.toLowerCase().includes(q));
        if (!idMatch && !nameMatch && !descMatch && !itemMatch) return false;
      }
      return true;
    });
  }, [giftBoxes, selectedGame, selectedType, selectedStatus, searchQuery]);

  const handleToggleStatus = async (box: GiftBox) => {
    setTogglingId(box.id);
    try {
      const updated = await api.toggleGiftBoxStatus(box.id);
      onShowToast(`礼匣「${box.name}」已切换为【${updated.status}】`);
      onRefresh();
    } catch (err: any) {
      onShowToast(`状态切换失败: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBox) return;
    try {
      await api.deleteGiftBox(deletingBox.id);
      onShowToast(`已删除定制礼匣「${deletingBox.name}」`);
      setDeletingBox(null);
      onRefresh();
    } catch (err: any) {
      onShowToast(`删除失败: ${err.message}`);
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "传说":
        return { bg: "#fcf4e2", border: "#d8b264", text: "#8f5e13" };
      case "史诗":
        return { bg: "#f8f0fc", border: "#b88dd9", text: "#682c99" };
      case "稀有":
        return { bg: "#edf5fa", border: "#7daed1", text: "#1b629c" };
      default:
        return { bg: "#f4f3ee", border: "#cec9bd", text: "#666e66" };
    }
  };

  const getTypeBadge = (box: GiftBox) => {
    switch (box.boxType) {
      case "fixed":
        return { label: "普通固定礼盒", bg: "#4a7a67" };
      case "random_prob":
        return { label: "随机概率盲盒", bg: "#8a589e" };
      case "single_choice":
        return { label: `单选自选(${box.items.length}选1)`, bg: "#366a8a" };
      case "multi_choice":
        return { label: `多选自选(${box.items.length}选${box.maxChoices})`, bg: "#a6682b" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Filter and Actions Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "16px 20px",
          background: "#fffefa",
          border: "1px solid #e5e1d7",
          borderRadius: "2px",
          boxShadow: "0 1px 4px rgba(30, 45, 35, 0.03)",
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "130px" }}>
            <AncientSelect
              value={selectedGame}
              onChange={setSelectedGame}
              options={["全部游戏", ...gameOptions.filter((g) => g !== "全部游戏")]}
              ariaLabel="筛选游戏"
            />
          </div>

          <div style={{ width: "120px" }}>
            <AncientSelect
              value={selectedType}
              onChange={setSelectedType}
              options={TYPE_FILTER_OPTIONS}
              ariaLabel="筛选类型"
            />
          </div>

          <div style={{ width: "110px" }}>
            <AncientSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={STATUS_FILTER_OPTIONS}
              ariaLabel="筛选状态"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              border: "1px solid #dcd7ca",
              borderRadius: "2px",
              background: "#faf9f5",
            }}
          >
            <Search size={14} color="#8a978f" />
            <input
              placeholder="搜索礼盒名或内含物品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "12px",
                color: "#283b30",
                outline: "none",
                width: "160px",
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={onOpenCreateItem}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              border: "1px dashed #7ea68e",
              borderRadius: "2px",
              background: "#f4f8f5",
              color: "#2b5d4a",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <PlusCircle size={14} /> 录入新道具
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              border: "1px solid #2d5d4c",
              borderRadius: "2px",
              background: "#2d5d4c",
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(45, 93, 76, 0.2)",
            }}
          >
            <Plus size={15} /> 定制新礼盒 / 礼包
          </button>
        </div>
      </div>

      {/* Gift Boxes Catalog Cards */}
      {filteredBoxes.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#fffefa",
            border: "1px solid #e5e1d7",
            borderRadius: "2px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#f4f2eb",
              margin: "0 auto 12px",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Package size={24} color="#8a978f" />
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#32443a" }}>
            未找到匹配的定制礼盒
          </div>
          <p style={{ fontSize: "12px", color: "#87968c", margin: "6px 0 16px" }}>
            暂无符合条件的定制礼包，您可以立即创建全新的定制宝盒或重置筛选条件。
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            style={{
              padding: "6px 14px",
              background: "#2d5d4c",
              color: "#fff",
              border: "none",
              borderRadius: "2px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            + 定制新礼盒
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredBoxes.map((box) => {
            const rarityStyle = getRarityBadge(box.rarity);
            const typeBadge = getTypeBadge(box);
            const isToggling = togglingId === box.id;

            return (
              <div
                key={box.id}
                style={{
                  border: "1px solid #e4e0d4",
                  borderRadius: "2px",
                  background: "#fffefa",
                  boxShadow: "0 2px 8px rgba(30, 45, 35, 0.03)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  position: "relative",
                  opacity: box.status === "已下架" ? 0.75 : 1,
                }}
              >
                <div>
                  {/* Top Header Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontFamily: "Cinzel, STSong, serif",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1e3328",
                          }}
                        >
                          {box.name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "2px",
                            background: rarityStyle.bg,
                            border: `1px solid ${rarityStyle.border}`,
                            color: rarityStyle.text,
                            fontWeight: 500,
                          }}
                        >
                          {box.rarity}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            padding: "1px 6px",
                            borderRadius: "2px",
                            background: "#f3f0e6",
                            border: "1px solid #ded8cb",
                            color: "#5b6d61",
                            fontFamily: "DM Sans, monospace",
                            fontWeight: 500,
                          }}
                          title={`系统唯一分配编号: ${box.id}`}
                        >
                          {box.id}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            background: typeBadge.bg,
                            color: "#fff",
                            borderRadius: "2px",
                            fontWeight: 500,
                          }}
                        >
                          {typeBadge.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8a978f" }}>
                          {box.game}
                        </span>
                        <span style={{ fontSize: "11px", color: "#b5beb8" }}>·</span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: box.status === "已启用" ? "#2b6b4b" : "#9e6152",
                          }}
                        >
                          {box.status}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(box)}
                      disabled={isToggling}
                      title={box.status === "已启用" ? "下架礼匣" : "启用礼匣"}
                      style={{
                        background: "transparent",
                        border: "1px solid #dcd7ca",
                        borderRadius: "2px",
                        padding: "4px 6px",
                        cursor: "pointer",
                        color: box.status === "已启用" ? "#2b6b4b" : "#8a968f",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                      }}
                    >
                      <Power size={12} />
                      {box.status === "已启用" ? "下架" : "启用"}
                    </button>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      margin: "10px 0 14px",
                      fontSize: "12px",
                      color: "#6b7a70",
                      lineHeight: 1.5,
                      minHeight: "36px",
                    }}
                  >
                    {box.description || "暂无描述"}
                  </p>

                  {/* Items Chips List */}
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#f9f8f4",
                      border: "1px dashed #ded8cb",
                      borderRadius: "2px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#54665a",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>宝匣包含配置 ({box.items.length} 种):</span>
                      {box.boxType === "random_prob" && (
                        <span style={{ color: "#8a589e" }}>各物品含掉落机率</span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {box.items.map((it, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "11px",
                            padding: "2px 7px",
                            background: "#fffefa",
                            border: "1px solid #dcd7cb",
                            borderRadius: "2px",
                            color: "#283b30",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{it.itemName}</span>
                          <span style={{ color: "#9c7739" }}>x{it.amount}</span>
                          {box.boxType === "random_prob" && (
                            <span
                              style={{
                                color: it.probability < 5 ? "#a65648" : "#2d5d4c",
                                fontWeight: 600,
                                fontSize: "10px",
                              }}
                            >
                              ({it.probability.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "1px solid #eeeae0",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    {/* Simulator Button */}
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(box)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#f2f8f4",
                        border: "1px solid #bad6c4",
                        color: "#265443",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                      title="模拟开箱试炼，检验概率与自选机制"
                    >
                      <Sparkles size={13} /> 开箱试炼
                    </button>

                    {/* Dispatch Button */}
                    <button
                      type="button"
                      onClick={() => onOpenDispatch(box)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: 500,
                        background: "#f4f7f9",
                        border: "1px solid #c2d6e4",
                        color: "#20506e",
                        borderRadius: "2px",
                        cursor: "pointer",
                      }}
                      title="直接向指定玩家发放定制礼匣"
                    >
                      <Send size={12} /> 发放玩家
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(box)}
                      style={{
                        background: "transparent",
                        border: "1px solid #dcd7ca",
                        borderRadius: "2px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        color: "#526358",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Edit3 size={12} /> 编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBox(box)}
                      style={{
                        background: "transparent",
                        border: "1px solid #eadcd9",
                        borderRadius: "2px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        color: "#ad5646",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingBox)}
        title="确认删除定制礼匣"
        message={`确定要永久删除定制礼匣「${deletingBox?.name}」吗？删除后玩家将无法再获取此礼匣配置。`}
        confirmText="确认删除"
        cancelText="取消"
        isDanger={true}
        onCancel={() => setDeletingBox(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
