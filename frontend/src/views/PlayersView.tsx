import { useState, useMemo } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  Edit2,
  Lock,
  Pin,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Tag,
  Unlock,
  UserCheck,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Player } from "../types";
import { money } from "../utils/format";

interface PlayersViewProps {
  players: Player[];
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  onSelectPlayer: (id: string) => void;
  onPlayersChange?: (players: Player[]) => void;
  onShowToast?: (msg: string) => void;
}

// 推荐快捷修仙运营标签候选
const PRESET_TAGS = [
  { name: "修仙榜首", color: "gold" },
  { name: "大R道友", color: "gold" },
  { name: "活跃帮主", color: "green" },
  { name: "核心KOL", color: "blue" },
  { name: "重点监控", color: "red" },
  { name: "作弊嫌疑", color: "red" },
  { name: "首充尝鲜", color: "blue" },
  { name: "测试道友", color: "green" },
];

export function PlayersView({
  players,
  query,
  onQueryChange,
  status,
  onStatusChange,
  onSelectPlayer,
  onPlayersChange,
  onShowToast = () => {},
}: PlayersViewProps) {
  // 编辑标签与备注弹窗状态
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [currentRemark, setCurrentRemark] = useState<string>("");
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 过滤玩家
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (status !== "全部状态" && player.status !== status) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const mName = player.name.toLowerCase().includes(q);
        const mID = player.id.toLowerCase().includes(q);
        const mGame = player.game.toLowerCase().includes(q);
        const mRemark = (player.remark || "").toLowerCase().includes(q);
        const mTag = (player.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!mName && !mID && !mGame && !mRemark && !mTag) return false;
      }
      return true;
    });
  }, [players, status, query]);

  // 2. 自动置顶排序逻辑：带有标签的玩家自动排在最上一行！
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const aHasTag = a.tags && a.tags.length > 0 ? 1 : 0;
      const bHasTag = b.tags && b.tags.length > 0 ? 1 : 0;

      // 拥有标签的玩家排在最上面
      if (aHasTag !== bHasTag) {
        return bHasTag - aHasTag;
      }

      // 同等置顶状态下，按累计充值降序排列
      return (b.spend || 0) - (a.spend || 0);
    });
  }, [filteredPlayers]);

  // 快捷打开标记/备注弹窗
  const openTagModal = (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    setEditingPlayer(player);
    setCurrentTags(player.tags ? [...player.tags] : []);
    setCurrentRemark(player.remark || "");
    setCustomTagInput("");
  };

  // 添加/切换标签
  const togglePresetTag = (tagName: string) => {
    if (currentTags.includes(tagName)) {
      setCurrentTags(currentTags.filter((t) => t !== tagName));
    } else {
      setCurrentTags([...currentTags, tagName]);
    }
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!currentTags.includes(trimmed)) {
      setCurrentTags([...currentTags, trimmed]);
    }
    setCustomTagInput("");
  };

  // 移除指定标签
  const handleRemoveTag = (tagName: string) => {
    setCurrentTags(currentTags.filter((t) => t !== tagName));
  };

  // 提交保存标签与备注
  const handleSaveTagAndRemark = async () => {
    if (!editingPlayer) return;
    setIsSubmitting(true);
    try {
      const updated = await api.updatePlayerTag(editingPlayer.id, {
        tags: currentTags,
        remark: currentRemark.trim(),
      });

      if (onPlayersChange) {
        const nextList = players.map((p) =>
          p.id === editingPlayer.id
            ? { ...p, tags: currentTags, remark: currentRemark.trim() }
            : p
        );
        onPlayersChange(nextList);
      }

      setEditingPlayer(null);
      if (currentTags.length > 0) {
        onShowToast(`玩家「${editingPlayer.name}」已添加标签并自动置顶到最上方展示`);
      } else {
        onShowToast(`玩家「${editingPlayer.name}」标签与备注已更新`);
      }
    } catch (err: any) {
      onShowToast(`更新玩家标签失败: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 快捷封禁 / 解封
  const handleToggleStatus = async (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    const newStatus = player.status === "正常" ? "已封禁" : "正常";
    try {
      await api.updatePlayerStatus(player.id, newStatus);
      if (onPlayersChange) {
        onPlayersChange(
          players.map((p) => (p.id === player.id ? { ...p, status: newStatus } : p))
        );
      }
      onShowToast(`玩家「${player.name}」状态已变更为: [${newStatus}]`);
    } catch (err: any) {
      onShowToast(`状态变更失败: ${err.message}`);
    }
  };

  // 获取标签颜色方案
  const getTagColorClass = (t: string) => {
    if (t.includes("首") || t.includes("大R") || t.includes("榜") || t.includes("尊")) return "gold";
    if (t.includes("监控") || t.includes("作弊") || t.includes("疑") || t.includes("外挂")) return "red";
    if (t.includes("帮主") || t.includes("长老") || t.includes("会长") || t.includes("活跃")) return "green";
    return "blue";
  };

  return (
    <div className="table-panel content-enter">
      {/* 顶部工具栏 */}
      <div className="table-toolbar">
        <div className="table-title">
          <h2>道友花名册</h2>
          <span>{players.length} 位修仙者</span>
        </div>

        <div className="table-filters">
          <div className="table-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="搜索道友昵称/UID/标签/备注..."
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onQueryChange("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="native-select-wrap">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {["全部状态", "正常", "已封禁"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="table-scroll">
        <table className="data-table ancient-table">
          <thead>
            <tr>
              <th style={{ width: 170, whiteSpace: "nowrap" }}>道友 / 编号</th>
              <th style={{ width: 170, whiteSpace: "nowrap" }}>运营标签 (自动置顶)</th>
              <th style={{ minWidth: 200, whiteSpace: "nowrap" }}>运营备注与备忘</th>
              <th style={{ width: 110, whiteSpace: "nowrap" }}>所属区服</th>
              <th style={{ width: 90, whiteSpace: "nowrap" }}>境界等级</th>
              <th style={{ width: 120, whiteSpace: "nowrap" }}>累计仙资</th>
              <th style={{ width: 110, whiteSpace: "nowrap" }}>最近上线</th>
              <th style={{ width: 90, whiteSpace: "nowrap" }}>账号状态</th>
              <th style={{ width: 180, textAlign: "center", whiteSpace: "nowrap" }}>管控操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#8a9c92" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <UserCheck size={32} style={{ opacity: 0.35 }} />
                    <span>未查询到任何匹配的道友数据</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedPlayers.map((player) => {
                const hasTags = player.tags && player.tags.length > 0;
                const isNormal = player.status === "正常";

                return (
                  <tr
                    key={player.id}
                    className={hasTags ? "player-row-pinned" : ""}
                    onClick={() => onSelectPlayer(player.id)}
                  >
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="person-cell" style={{ whiteSpace: "nowrap" }}>
                        <div style={{ position: "relative" }}>
                          <span className="person-avatar">{player.name.slice(0, 1)}</span>
                          {hasTags && (
                            <span
                              style={{
                                position: "absolute",
                                top: -3,
                                right: -3,
                                background: "#b38842",
                                color: "#fff",
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }}
                              title="已标记标签（置顶优先展示）"
                            >
                              <Pin size={9} />
                            </span>
                          )}
                        </div>
                        <span style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <strong style={{ whiteSpace: "nowrap" }}>{player.name}</strong>
                            {hasTags && (
                              <span className="pin-badge" title="拥有标签，已置顶于最上方展示">
                                置顶
                              </span>
                            )}
                          </div>
                          <small style={{ whiteSpace: "nowrap" }}>{player.id}</small>
                        </span>
                      </div>
                    </td>

                    {/* 运营标签列 */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {hasTags ? (
                        <div style={{ display: "inline-flex", flexWrap: "nowrap", gap: 4, alignItems: "center", whiteSpace: "nowrap" }}>
                          {player.tags!.map((t, idx) => (
                            <span
                              key={idx}
                              className={`player-tag-seal ${getTagColorClass(t)}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#95a89c" }}>无标签</span>
                      )}
                    </td>

                    {/* 运营备注列 */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {player.remark ? (
                        <div className="player-remark-text" title={player.remark}>
                          {player.remark}
                        </div>
                      ) : (
                        <span style={{ color: "#a5b4ab", fontSize: 11 }}>-</span>
                      )}
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="game-tag" style={{ whiteSpace: "nowrap" }}>{player.game}</span>
                    </td>

                    <td style={{ whiteSpace: "nowrap", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
                      Lv.{player.level}
                    </td>

                    <td className="numeric-cell amount-cell" style={{ whiteSpace: "nowrap" }}>
                      {money(player.spend)}
                    </td>

                    <td style={{ fontSize: 11.5, color: "#5d7165", whiteSpace: "nowrap" }}>
                      {player.lastActive}
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <StatusBadge value={player.status} />
                    </td>

                    {/* 管控操作 */}
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {/* 标记与备注按钮 */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                          onClick={(e) => openTagModal(e, player)}
                          title="管理该道友的标签与运营备注"
                        >
                          <Tag size={11} style={{ marginRight: 2 }} />
                          标记
                        </button>

                        {/* 封禁/解封按钮 */}
                        <button
                          type="button"
                          className={`btn btn-sm ${isNormal ? "btn-secondary" : "btn-primary"}`}
                          style={{
                            padding: "2px 8px",
                            fontSize: 11,
                            color: isNormal ? "#b42b1b" : "#fff",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          onClick={(e) => handleToggleStatus(e, player)}
                          title={isNormal ? "封禁该账号" : "解除封禁"}
                        >
                          {isNormal ? "封禁" : "解封"}
                        </button>

                        {/* 查看按钮 */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                          onClick={() => onSelectPlayer(player.id)}
                        >
                          查看
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer-custom" style={{ padding: "10px 18px", borderTop: "1px solid #ede8dc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#6e8276", whiteSpace: "nowrap" }}>
          共计 {sortedPlayers.length} 位道友（拥有标签的道友已自动置顶在最上方展示）
        </span>
        <span style={{ fontSize: 11.5, color: "#8a9c92", whiteSpace: "nowrap" }}>
          支持多维运营标签、专属备忘录持久化及跨服置顶管理
        </span>
      </div>

      {/* 弹窗: 编辑玩家标签与备注 Modal */}
      {editingPlayer && (
        <div className="modal-backdrop" onClick={() => setEditingPlayer(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">设置道友标签与备注</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingPlayer(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* 目标玩家简介 */}
              <div
                style={{
                  background: "#f4f1ea",
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: "#6e8276" }}>目标道友：</span>
                  <strong style={{ color: "#19362a", marginLeft: 4 }}>{editingPlayer.name}</strong>
                  <span style={{ color: "#8c9e93", marginLeft: 6, fontFamily: "monospace" }}>({editingPlayer.id})</span>
                </div>
                <span className="game-tag">{editingPlayer.game}</span>
              </div>

              {/* 当前已有标签 */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 6 }}>
                  当前标签 <span style={{ color: "#8c9e93", fontWeight: 400 }}>(有标签的玩家自动置顶首行)</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32, padding: "6px 8px", background: "#faf9f6", border: "1px solid #ded7ca", borderRadius: 6 }}>
                  {currentTags.length === 0 ? (
                    <span style={{ fontSize: 11.5, color: "#a5b4ab" }}>暂未添加任何标签</span>
                  ) : (
                    currentTags.map((tag) => (
                      <span
                        key={tag}
                        className={`player-tag-seal ${getTagColorClass(tag)}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "inherit", opacity: 0.65 }}
                          title="移除该标签"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 快捷推荐修仙标签 */}
              <div>
                <label style={{ fontSize: 11.5, color: "#6e8276", display: "block", marginBottom: 6 }}>
                  点击快速勾选推荐标签：
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRESET_TAGS.map((pt) => {
                    const isSelected = currentTags.includes(pt.name);
                    return (
                      <button
                        key={pt.name}
                        type="button"
                        onClick={() => togglePresetTag(pt.name)}
                        className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: 11, padding: "2px 8px", height: 24, borderRadius: 12 }}
                      >
                        {isSelected && <Check size={11} style={{ marginRight: 2 }} />}
                        {pt.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 自定义新增标签 */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ flex: 1, height: 32, fontSize: 12 }}
                  placeholder="输入自定义新标签..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ height: 32 }}
                  onClick={handleAddCustomTag}
                >
                  <Plus size={13} />
                  <span>添加</span>
                </button>
              </div>

              {/* 运营备注备忘录 */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  专属运营备注 / 备忘录
                </label>
                <textarea
                  className="search-input"
                  style={{ width: "100%", height: 75, resize: "none", padding: "8px 10px", fontSize: 12, lineHeight: 1.5 }}
                  placeholder="在此记录道友专属客服沟通进度、封禁缘由、历史申诉或特殊照拂备忘..."
                  value={currentRemark}
                  onChange={(e) => setCurrentRemark(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingPlayer(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTagAndRemark}
                disabled={isSubmitting}
              >
                保存并自动置顶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
