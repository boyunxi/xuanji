import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Dices, Gift, Sparkles, Trophy, X, RotateCcw } from "lucide-react";
import { api } from "../../api/client";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import type { GiftBox, SimulateOpenResponse } from "../../types";

interface BoxOpenSimulatorModalProps {
  isOpen: boolean;
  box: GiftBox | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function BoxOpenSimulatorModal({
  isOpen,
  box,
  onClose,
  onShowToast,
}: BoxOpenSimulatorModalProps) {
  useBodyScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateOpenResponse | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

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

  const handleToggleCandidate = (itemName: string) => {
    if (box.boxType === "single_choice") {
      setSelectedCandidates([itemName]);
    } else if (box.boxType === "multi_choice") {
      if (selectedCandidates.includes(itemName)) {
        setSelectedCandidates(selectedCandidates.filter((n) => n !== itemName));
      } else {
        if (selectedCandidates.length >= box.maxChoices) {
          onShowToast(`此礼匣至多可选 ${box.maxChoices} 项`);
          return;
        }
        setSelectedCandidates([...selectedCandidates, itemName]);
      }
    }
  };

  const handleSimulateOpen = async () => {
    if (box.boxType === "single_choice" && selectedCandidates.length === 0) {
      onShowToast("请先在候选中挑选 1 项宝物");
      return;
    }
    if (box.boxType === "multi_choice" && selectedCandidates.length === 0) {
      onShowToast(`请先在候选中挑选 1~${box.maxChoices} 项宝物`);
      return;
    }

    setLoading(true);

    // If random_prob, simulate a brief dice rolling highlight animation
    if (box.boxType === "random_prob" && box.items.length > 1) {
      let step = 0;
      const interval = setInterval(() => {
        setAnimatingIndex(step % box.items.length);
        step++;
      }, 70);

      try {
        const res = await api.simulateOpenBox(box.id, {
          chosenItems: selectedCandidates,
        });
        setTimeout(() => {
          clearInterval(interval);
          setAnimatingIndex(res.rolledIndex ?? null);
          setResult(res);
          setLoading(false);
        }, 600);
      } catch (err: any) {
        clearInterval(interval);
        setAnimatingIndex(null);
        setLoading(false);
        onShowToast(`开箱模拟失败: ${err.message}`);
      }
      return;
    }

    try {
      const res = await api.simulateOpenBox(box.id, {
        chosenItems: selectedCandidates,
      });
      setResult(res);
    } catch (err: any) {
      onShowToast(`开箱模拟失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedCandidates([]);
    setAnimatingIndex(null);
  };

  const boxTypeTag = (() => {
    switch (box.boxType) {
      case "fixed":
        return { label: "普通固定礼匣", bg: "#4a7a67" };
      case "random_prob":
        return { label: "随机概率盲盒", bg: "#8a589e" };
      case "single_choice":
        return { label: "单选自选礼匣 (N选1)", bg: "#366a8a" };
      case "multi_choice":
        return {
          label: `多选自选礼匣 (${box.items.length}选${box.maxChoices})`,
          bg: "#a6682b",
        };
    }
  })();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "传说":
        return { border: "#e8b858", bg: "#fff9ea", text: "#96650e" };
      case "史诗":
        return { border: "#b285d8", bg: "#f9f2ff", text: "#682c99" };
      case "稀有":
        return { border: "#68a6d8", bg: "#f0f7ff", text: "#1b629c" };
      default:
        return { border: "#ccc5b5", bg: "#faf8f2", text: "#596159" };
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
        style={{ width: "min(100%, 640px)", maxHeight: "90vh", overflowY: "auto" }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulator-title"
      >
        <button className="confirm-close-btn" onClick={onClose} aria-label="关闭">
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="confirm-body" style={{ paddingBottom: "12px" }}>
          <div
            className="confirm-icon-seal"
            style={{
              background: "#fcf8ee",
              border: "1px solid #d8b87a",
              boxShadow: "inset 0 0 0 2px rgba(216, 184, 122, 0.15)",
            }}
          >
            <Sparkles size={22} color="#966d21" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                id="simulator-title"
                style={{
                  fontFamily: "Cinzel, STSong, serif",
                  fontSize: "16px",
                  color: "#21362b",
                  margin: 0,
                }}
              >
                开箱试炼模拟器 · {box.name}
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 6px",
                  background: boxTypeTag.bg,
                  color: "#fff",
                  borderRadius: "2px",
                  fontWeight: 500,
                }}
              >
                {boxTypeTag.label}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#798c81" }}>
              测试不同礼匣开箱机制，核对真实随机概率掉落或自选领取逻辑。
            </p>
          </div>
        </div>

        {/* Box Description info */}
        <div
          style={{
            margin: "0 26px 14px",
            padding: "8px 12px",
            background: "#fbf9f4",
            border: "1px dashed #dcd4c3",
            borderRadius: "2px",
            fontSize: "12px",
            color: "#6b7a70",
            lineHeight: 1.5,
          }}
        >
          {box.description || "无特殊说明"}
        </div>

        {/* MAIN INTERACTIVE CONTENT */}
        <div style={{ padding: "0 26px 20px" }}>
          {result ? (
            /* RESULTS VIEW */
            <div style={{ textAlign: "center", animation: "dialog-in 0.25s ease both" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #fbf2dc 0%, #ecd9ad 100%)",
                  border: "2px solid #cfab59",
                  margin: "8px auto 14px",
                  boxShadow: "0 4px 16px rgba(181, 132, 58, 0.25)",
                }}
              >
                <Trophy size={28} color="#8a5f17" />
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#294638",
                  padding: "10px 16px",
                  background: "#f4f8f4",
                  border: "1px solid #c7decb",
                  borderRadius: "3px",
                  marginBottom: "18px",
                  lineHeight: 1.6,
                }}
              >
                {result.message}
              </div>

              <div style={{ fontSize: "12px", color: "#74857b", marginBottom: "10px" }}>
                本次开箱斩获物资如下：
              </div>

              {/* Won Items Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {result.wonItems.map((item, idx) => {
                  const style = getRarityColor(item.rarity);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "14px 10px",
                        border: `1.5px solid ${style.border}`,
                        borderRadius: "3px",
                        background: style.bg,
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          border: `1px solid ${style.border}`,
                          borderRadius: "2px",
                          color: style.text,
                          fontWeight: 500,
                        }}
                      >
                        {item.rarity} · {item.category}
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#1e3328",
                          marginTop: "2px",
                        }}
                      >
                        {item.itemName}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#96650e",
                        }}
                      >
                        x {item.amount}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  paddingTop: "14px",
                  borderTop: "1px solid #eeeae0",
                }}
              >
                <button
                  type="button"
                  className="confirm-btn cancel"
                  onClick={onClose}
                >
                  关闭试炼
                </button>
                <button
                  type="button"
                  className="confirm-btn primary"
                  onClick={handleReset}
                  style={{
                    background: "#2d5d4c",
                    borderColor: "#2d5d4c",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <RotateCcw size={14} /> 再次试炼 / 重新开箱
                </button>
              </div>
            </div>
          ) : (
            /* CANDIDATE & READY TO OPEN VIEW */
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2d4438" }}>
                  {box.boxType === "single_choice"
                    ? "请选择欲领取的 1 件物品："
                    : box.boxType === "multi_choice"
                    ? `请选择欲领取的物品 (已选 ${selectedCandidates.length}/${box.maxChoices})：`
                    : "礼匣内含配置物资："}
                </span>

                {box.boxType === "random_prob" && (
                  <span style={{ fontSize: "11px", color: "#74857b" }}>
                    开箱将按概率模拟真随机数判定
                  </span>
                )}
              </div>

              {/* Items Card List */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {box.items.map((it, idx) => {
                  const style = getRarityColor(it.rarity);
                  const isChosen = selectedCandidates.includes(it.itemName);
                  const isHighlighted = animatingIndex === idx;
                  const isSelectable =
                    box.boxType === "single_choice" || box.boxType === "multi_choice";

                  return (
                    <div
                      key={idx}
                      onClick={() => isSelectable && handleToggleCandidate(it.itemName)}
                      style={{
                        padding: "12px 10px",
                        border: isChosen
                          ? "2px solid #2d5d4c"
                          : isHighlighted
                          ? "2px solid #cfab59"
                          : `1px solid ${style.border}`,
                        borderRadius: "3px",
                        background: isChosen
                          ? "#eef5f2"
                          : isHighlighted
                          ? "#fff9ea"
                          : style.bg,
                        cursor: isSelectable ? "pointer" : "default",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        position: "relative",
                        transform: isHighlighted ? "scale(1.03)" : "none",
                        boxShadow: isChosen
                          ? "0 2px 10px rgba(45, 93, 76, 0.15)"
                          : "none",
                      }}
                    >
                      {/* Selection Check Icon */}
                      {isSelectable && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "18px",
                            height: "18px",
                            borderRadius: box.boxType === "single_choice" ? "50%" : "2px",
                            border: isChosen ? "none" : "1px solid #bfb8a8",
                            background: isChosen ? "#2d5d4c" : "transparent",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {isChosen && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 5px",
                            borderRadius: "2px",
                            border: `1px solid ${style.border}`,
                            color: style.text,
                          }}
                        >
                          {it.rarity}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8a968d" }}>
                          {it.category}
                        </span>
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "#22382e",
                          marginTop: "2px",
                        }}
                      >
                        {it.itemName}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "4px",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "#7a8a7f" }}>数量: x{it.amount}</span>
                        {box.boxType === "random_prob" && (
                          <span
                            style={{
                              fontWeight: 600,
                              color: it.probability < 5 ? "#a65648" : "#2d5d4c",
                            }}
                          >
                            概率 {it.probability.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
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
                  type="button"
                  className="confirm-btn primary"
                  onClick={handleSimulateOpen}
                  disabled={
                    loading ||
                    (box.boxType === "single_choice" && selectedCandidates.length === 0) ||
                    (box.boxType === "multi_choice" && selectedCandidates.length === 0)
                  }
                  style={{
                    background: "#2d5d4c",
                    borderColor: "#2d5d4c",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  {box.boxType === "random_prob" ? (
                    <>
                      <Dices size={16} />
                      {loading ? "天命掷骰中..." : "开启随机概率盲盒"}
                    </>
                  ) : box.boxType === "single_choice" ? (
                    <>
                      <Sparkles size={16} />
                      {loading ? "开启中..." : "确认自选并开启"}
                    </>
                  ) : box.boxType === "multi_choice" ? (
                    <>
                      <Sparkles size={16} />
                      {loading
                        ? "开启中..."
                        : `确认自选 (${selectedCandidates.length}/${box.maxChoices}) 并开启`}
                    </>
                  ) : (
                    <>
                      <Gift size={16} />
                      {loading ? "开启中..." : "开启固定礼匣"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
