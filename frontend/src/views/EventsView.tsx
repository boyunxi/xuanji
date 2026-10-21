import { useState, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Event, Game } from "../types";
import { number } from "../utils/format";

interface EventsViewProps {
  events: Event[];
  onEventsChange?: (events: Event[]) => void;
  onShowToast?: (msg: string) => void;
  game?: Game;
  onSelectEvent?: (id: string) => void;
}

export function EventsView({
  events,
  onEventsChange,
  onShowToast = () => {},
  game = "全部游戏",
  onSelectEvent,
}: EventsViewProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部状态");

  // 编辑弹窗状态
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGame, setEditGame] = useState("山海长歌");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editStatus, setEditStatus] = useState("未开始");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 新建活动弹窗状态
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGame, setNewGame] = useState("山海长歌");
  const [newStart, setNewStart] = useState(new Date().toISOString().slice(0, 10));
  const [newEnd, setNewEnd] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );

  // 二次确认弹窗
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "reset-data" | "reset-event" | "delete";
    event: Event | null;
  }>({ open: false, type: "reset-data", event: null });

  // 过滤活动
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (game !== "全部游戏" && e.game !== game) return false;
      if (statusFilter !== "全部状态" && e.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const mTitle = e.title.toLowerCase().includes(q);
        const mID = e.id.toLowerCase().includes(q);
        if (!mTitle && !mID) return false;
      }
      return true;
    });
  }, [events, game, statusFilter, query]);

  // KPI 统计
  const stats = useMemo(() => {
    const total = events.length;
    const running = events.filter((e) => e.status === "进行中").length;
    const pending = events.filter((e) => e.status === "未开始").length;
    const totalParticipants = events.reduce((sum, e) => sum + (e.participants || 0), 0);
    return { total, running, pending, totalParticipants };
  }, [events]);

  // 计算周期相对剩余天数
  const getCycleBadge = (start: string, end: string, status: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    const endDate = new Date(end);

    const baseStyle = { fontSize: 11, padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" as const, flexShrink: 0, display: "inline-block" };

    if (status === "已结束") {
      return <span style={{ ...baseStyle, color: "#8b9c92", background: "#f0ece4" }}>已闭幕</span>;
    }
    if (status === "已暂停") {
      return <span style={{ ...baseStyle, color: "#a05b22", background: "#fbf2e5" }}>暂停中</span>;
    }

    const diffStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const diffEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffStart > 0) {
      return <span style={{ ...baseStyle, color: "#8a661b", background: "#fbf5e6" }}>距开启 {diffStart} 天</span>;
    }
    if (diffEnd >= 0) {
      return <span style={{ ...baseStyle, color: "#1e6042", background: "#ebf7f0" }}>剩 {diffEnd} 天</span>;
    }
    return <span style={{ ...baseStyle, color: "#8b9c92", background: "#f0ece4" }}>已超时</span>;
  };

  // 1. 开关活动 (Toggle)
  const handleToggleStatus = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleEvent(event.id);
      if (onEventsChange) {
        onEventsChange(events.map((it) => (it.id === updated.id ? updated : it)));
      }
      onShowToast(`活动「${updated.title}」状态已切换为: ${updated.status}`);
    } catch (err: any) {
      onShowToast(`切换活动状态失败: ${err.message}`);
    }
  };

  // 2. 打开编辑弹窗
  const openEditModal = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditGame(event.game);
    setEditStart(event.start);
    setEditEnd(event.end);
    setEditStatus(event.status);
  };

  // 保存活动编辑
  const handleSaveEdit = async () => {
    if (!editingEvent || !editTitle.trim()) {
      onShowToast("活动名称不能为空");
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await api.updateEvent(editingEvent.id, {
        title: editTitle,
        game: editGame,
        start: editStart,
        end: editEnd,
        status: editStatus,
      });
      if (onEventsChange) {
        onEventsChange(events.map((it) => (it.id === updated.id ? updated : it)));
      }
      setEditingEvent(null);
      onShowToast(`活动「${updated.title}」起止日期与配置已保存`);
    } catch (err: any) {
      onShowToast(`更新活动失败: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 执行新建活动
  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      onShowToast("请输入活动名称");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await api.createEvent({
        title: newTitle,
        game: newGame,
        start: newStart,
      });
      // 补充结束时间
      if (newEnd) {
        await api.updateEvent(created.id, { end: newEnd });
        created.end = newEnd;
      }
      if (onEventsChange) {
        onEventsChange([created, ...events]);
      }
      setIsCreating(false);
      setNewTitle("");
      onShowToast(`活动「${created.title}」创建成功`);
    } catch (err: any) {
      onShowToast(`创建活动失败: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 重置活动数据 (参与人数归零)
  const executeResetData = async () => {
    const target = confirmModal.event;
    if (!target) return;
    try {
      const updated = await api.resetEventData(target.id);
      if (onEventsChange) {
        onEventsChange(events.map((it) => (it.id === updated.id ? updated : it)));
      }
      onShowToast(`活动「${target.title}」运行时数据与参与人次已清零重置`);
    } catch (err: any) {
      onShowToast(`重置活动数据失败: ${err.message}`);
    } finally {
      setConfirmModal({ open: false, type: "reset-data", event: null });
    }
  };

  // 5. 重置活动周期 (周期平移，状态置为未开始，人数归零)
  const executeResetEvent = async () => {
    const target = confirmModal.event;
    if (!target) return;
    try {
      const updated = await api.resetEvent(target.id);
      if (onEventsChange) {
        onEventsChange(events.map((it) => (it.id === updated.id ? updated : it)));
      }
      onShowToast(`活动「${target.title}」已重置并平移至新周期 (${updated.start} ~ ${updated.end})`);
    } catch (err: any) {
      onShowToast(`重置活动周期失败: ${err.message}`);
    } finally {
      setConfirmModal({ open: false, type: "reset-event", event: null });
    }
  };

  // 6. 删除活动
  const executeDeleteEvent = async () => {
    const target = confirmModal.event;
    if (!target) return;
    try {
      await api.deleteEvent(target.id);
      if (onEventsChange) {
        onEventsChange(events.filter((it) => it.id !== target.id));
      }
      onShowToast(`活动「${target.title}」已安全删除`);
    } catch (err: any) {
      onShowToast(`删除活动失败: ${err.message}`);
    } finally {
      setConfirmModal({ open: false, type: "delete", event: null });
    }
  };

  return (
    <div className="view-container">
      {/* 顶部精细化 KPI 指标看板 */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">配置活动总数</span>
            <span className="metric-badge primary">
              <Activity size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.total}
            <span className="metric-unit">个</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">覆盖全区服周期性与限定节庆活动</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">正在进行中</span>
            <span className="metric-badge positive">
              <Flame size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.running}
            <span className="metric-unit">场</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">在线道友可实时参与并结算奖励</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">筹备与待开启</span>
            <span className="metric-badge warning">
              <Clock size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.pending}
            <span className="metric-unit">个</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">已完成起止时间编排，就绪待发</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">累计参与道友</span>
            <span className="metric-badge accent">
              <Users size={14} />
            </span>
          </div>
          <div className="metric-value">
            {number(stats.totalParticipants)}
            <span className="metric-unit">人次</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">全服玩家活动打卡与玩法结算人次</span>
          </div>
        </div>
      </div>

      {/* 主面板与表格 */}
      <div className="table-panel">
        <div className="table-header-custom" style={{ padding: "12px 16px", borderBottom: "1px solid #ede8dc" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* 状态筛选药丸 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["全部状态", "进行中", "未开始", "已暂停", "已结束"].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: 12, borderRadius: 14 }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* 搜索与新建按钮 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="search-input-wrapper" style={{ width: 220 }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索活动名称或编号..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button type="button" className="search-clear-btn" onClick={() => setQuery("")}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreating(true)}
              >
                <Plus size={14} />
                <span>新建活动</span>
              </button>
            </div>
          </div>
        </div>

        {/* 活动数据表格 */}
        <div className="table-scroll">
          <table className="ancient-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>活动编号</th>
                <th style={{ minWidth: 180 }}>活动名称</th>
                <th style={{ width: 120 }}>所属游戏</th>
                <th style={{ width: 210 }}>起止日期排期</th>
                <th style={{ width: 105 }}>周期状态</th>
                <th style={{ width: 115, textAlign: "right" }}>参与道友</th>
                <th style={{ width: 95 }}>活动状态</th>
                <th style={{ width: 220, textAlign: "center" }}>精细化管控</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#8a9c92" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Activity size={32} style={{ opacity: 0.35 }} />
                      <span>未查询到任何匹配的活动</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item) => {
                  const isRunning = item.status === "进行中";

                  return (
                    <tr
                      key={item.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectEvent && onSelectEvent(item.id)}
                    >
                      <td>
                        <code style={{ fontSize: 11.5, color: "#19362a", fontWeight: 600 }}>{item.id}</code>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, whiteSpace: "nowrap" }}>
                          <strong style={{ color: "#1a382c", fontSize: 13, whiteSpace: "nowrap" }}>{item.title}</strong>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 500, color: "#254638", fontSize: 12, whiteSpace: "nowrap" }}>{item.game}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4f6558", whiteSpace: "nowrap", flexShrink: 0 }}>
                          <Calendar size={13} style={{ color: "#799184", flexShrink: 0 }} />
                          <span style={{ whiteSpace: "nowrap" }}>{item.start} ~ {item.end}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{getCycleBadge(item.start, item.end, item.status)}</td>
                      <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 600, color: "#1c352f", whiteSpace: "nowrap" }}>
                        {number(item.participants)}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {/* 开关活动按钮 */}
                          <button
                            type="button"
                            className={`btn btn-sm ${isRunning ? "btn-secondary" : "btn-primary"}`}
                            style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                            onClick={(e) => handleToggleStatus(e, item)}
                            title={isRunning ? "暂停当前活动" : "上线开启此活动"}
                          >
                            {isRunning ? (
                              <>
                                <Pause size={11} style={{ marginRight: 2 }} />
                                暂停
                              </>
                            ) : (
                              <>
                                <Play size={11} style={{ marginRight: 2 }} />
                                开启
                              </>
                            )}
                          </button>

                          {/* 编辑起止日期与信息 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 8px", fontSize: 11 }}
                            onClick={(e) => openEditModal(e, item)}
                            title="修改活动名称、游戏、起止时间"
                          >
                            <Edit3 size={11} style={{ marginRight: 2 }} />
                            排期
                          </button>

                          {/* 重置数据 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 7px", fontSize: 11, color: "#a05b22" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ open: true, type: "reset-data", event: item });
                            }}
                            title="清空参与人次与运行时数据"
                          >
                            <RotateCcw size={11} />
                          </button>

                          {/* 重置周期 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 7px", fontSize: 11, color: "#2b5643" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ open: true, type: "reset-event", event: item });
                            }}
                            title="重置活动周期至下一轮新周期"
                          >
                            <RefreshCw size={11} />
                          </button>

                          {/* 删除活动 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 6px", fontSize: 11, color: "#b42b1b" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ open: true, type: "delete", event: item });
                            }}
                            title="删除活动"
                          >
                            <Trash2 size={11} />
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

        <div className="table-footer-custom" style={{ padding: "10px 16px", borderTop: "1px solid #ede8dc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6e8276" }}>
            显示第 1 至 {filteredEvents.length} 个活动，共计 {filteredEvents.length} 项
          </span>
          <span style={{ fontSize: 11.5, color: "#8a9c92" }}>
            支持活动起止日期动态微调、参与数据重置与周期滚动重启
          </span>
        </div>
      </div>

      {/* 弹窗 1: 编辑活动起止日期与配置 */}
      {editingEvent && (
        <div className="modal-backdrop" onClick={() => setEditingEvent(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Edit3 size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">编辑活动排期与参数</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setEditingEvent(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  活动名称
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  所属游戏
                </label>
                <select
                  className="ancient-select"
                  style={{ width: "100%", padding: "6px 10px" }}
                  value={editGame}
                  onChange={(e) => setEditGame(e.target.value)}
                >
                  <option value="全部游戏">全部游戏</option>
                  <option value="山海长歌">山海长歌</option>
                  <option value="九州志">九州志</option>
                  <option value="云间录">云间录</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    开始日期
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    结束日期
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  活动状态
                </label>
                <select
                  className="ancient-select"
                  style={{ width: "100%", padding: "6px 10px" }}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="未开始">未开始</option>
                  <option value="进行中">进行中</option>
                  <option value="已暂停">已暂停</option>
                  <option value="已结束">已结束</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingEvent(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                保存排期
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 2: 新建活动弹窗 */}
      {isCreating && (
        <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">起草新建游戏活动</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsCreating(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  活动标题
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="例如：万剑归宗 · 跨服巅峰赛"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  所属游戏
                </label>
                <select
                  className="ancient-select"
                  style={{ width: "100%", padding: "6px 10px" }}
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                >
                  <option value="山海长歌">山海长歌</option>
                  <option value="九州志">九州志</option>
                  <option value="云间录">云间录</option>
                  <option value="全部游戏">全部游戏</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    活动开始日期
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    活动结束日期
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreating(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateEvent}
                disabled={isSubmitting}
              >
                立即创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 3: 二次确认对话框 (重置数据 / 重置活动周期 / 删除) */}
      {confirmModal.open && confirmModal.event && (
        <div className="modal-backdrop" onClick={() => setConfirmModal({ open: false, type: "reset-data", event: null })}>
          <div
            className="modal-card"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle
                  size={18}
                  style={{
                    color:
                      confirmModal.type === "delete"
                        ? "#b42b1b"
                        : confirmModal.type === "reset-data"
                        ? "#a05b22"
                        : "#2b5643",
                  }}
                />
                <h3 className="modal-title">
                  {confirmModal.type === "reset-data" && "确认重置活动数据"}
                  {confirmModal.type === "reset-event" && "确认重置活动周期"}
                  {confirmModal.type === "delete" && "确认删除该活动"}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setConfirmModal({ open: false, type: "reset-data", event: null })}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: 13, color: "#3a5144", lineHeight: 1.6 }}>
              {confirmModal.type === "reset-data" && (
                <p>
                  您确定要重置活动 <strong>「{confirmModal.event.title}」</strong> 的玩家参与数据吗？
                  <br />
                  <span style={{ color: "#a05b22", fontSize: 12 }}>
                    执行后，该活动的累计参与人次将被归零，玩家活动积分与排行榜将清空，此操作不可撤销。
                  </span>
                </p>
              )}
              {confirmModal.type === "reset-event" && (
                <p>
                  您确定要重置活动 <strong>「{confirmModal.event.title}」</strong> 并滚动至下一周期吗？
                  <br />
                  <span style={{ color: "#2b5643", fontSize: 12 }}>
                    执行后，活动将重置为【未开始】状态，参与人次清零，起止日期将平移至未来 7 天周期。
                  </span>
                </p>
              )}
              {confirmModal.type === "delete" && (
                <p>
                  您确定要彻底删除活动 <strong>「{confirmModal.event.title}」</strong> (ID: {confirmModal.event.id}) 吗？
                  <br />
                  <span style={{ color: "#b42b1b", fontSize: 12 }}>
                    删除后该活动将从所有区服列表中移除，相关排期不可恢复。
                  </span>
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ open: false, type: "reset-data", event: null })}
              >
                取消
              </button>
              <button
                type="button"
                className={`btn ${confirmModal.type === "delete" ? "btn-danger" : "btn-primary"}`}
                style={
                  confirmModal.type === "delete"
                    ? { background: "#b42b1b", color: "#fff", borderColor: "#932316" }
                    : {}
                }
                onClick={
                  confirmModal.type === "reset-data"
                    ? executeResetData
                    : confirmModal.type === "reset-event"
                    ? executeResetEvent
                    : executeDeleteEvent
                }
              >
                确定执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
