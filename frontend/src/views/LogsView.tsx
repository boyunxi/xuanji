import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Download,
  FileSpreadsheet,
  Flame,
  Gamepad2,
  Package,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Game, GameLog, GMLog } from "../types";

interface LogsViewProps {
  onShowToast: (msg: string) => void;
  game?: Game;
}

export function LogsView({ onShowToast, game = "全部游戏" }: LogsViewProps) {
  // 主 Tab: "game" (游戏日志) | "operation" (操作日志)
  const [activeMainTab, setActiveMainTab] = useState<"game" | "operation">("game");

  // 操作日志状态
  const [opLogs, setOpLogs] = useState<GMLog[]>([]);
  const [opLoading, setOpLoading] = useState(false);
  const [opCategory, setOpCategory] = useState<string>("all");
  const [opStatusFilter, setOpStatusFilter] = useState<string>("全部状态");
  const [opSearchQuery, setOpSearchQuery] = useState("");
  const [selectedOpLog, setSelectedOpLog] = useState<GMLog | null>(null);

  // 游戏日志状态
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [gameLoading, setGameLoading] = useState(false);
  const [gameCategory, setGameCategory] = useState<string>("all");
  const [gameLevelFilter, setGameLevelFilter] = useState<string>("全部级别");
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [selectedGameLog, setSelectedGameLog] = useState<GameLog | null>(null);

  // 异步加载操作日志
  const fetchOpLogs = async () => {
    setOpLoading(true);
    try {
      const data = await api.getLogs();
      setOpLogs(data);
    } catch (err: any) {
      try {
        const fallback = await api.getGMLogs();
        setOpLogs(fallback);
      } catch (e: any) {
        onShowToast(`拉取操作日志失败: ${err.message || e.message}`);
      }
    } finally {
      setOpLoading(false);
    }
  };

  // 异步加载游戏日志
  const fetchGameLogs = async () => {
    setGameLoading(true);
    try {
      const data = await api.getGameLogs({
        game: game !== "全部游戏" ? game : undefined,
      });
      setGameLogs(data);
    } catch (err: any) {
      onShowToast(`拉取游戏日志失败: ${err.message}`);
    } finally {
      setGameLoading(false);
    }
  };

  useEffect(() => {
    fetchOpLogs();
    fetchGameLogs();
  }, [game]);

  // 筛选操作日志
  const filteredOpLogs = useMemo(() => {
    return opLogs.filter((log) => {
      if (game !== "全部游戏" && !log.target.includes(game) && !log.detail.includes(game)) {
        return false;
      }
      if (opCategory === "item" && !log.action.includes("道具") && !log.action.includes("礼盒") && !log.action.includes("礼包")) {
        return false;
      }
      if (opCategory === "broadcast" && !log.action.includes("广播") && !log.action.includes("跑马灯")) {
        return false;
      }
      if (opCategory === "command" && !log.action.includes("指令") && !log.action.includes("配表")) {
        return false;
      }
      if (opCategory === "mail" && !log.action.includes("信函") && !log.action.includes("CDKey") && !log.action.includes("邮件")) {
        return false;
      }
      if (opCategory === "security" && !log.action.includes("鉴权") && !log.action.includes("封禁") && !log.action.includes("登录")) {
        return false;
      }
      if (opStatusFilter !== "全部状态" && log.status !== opStatusFilter) {
        return false;
      }
      if (opSearchQuery.trim()) {
        const q = opSearchQuery.toLowerCase();
        const mID = log.id.toLowerCase().includes(q);
        const mOp = log.operator.toLowerCase().includes(q);
        const mAct = log.action.toLowerCase().includes(q);
        const mTgt = log.target.toLowerCase().includes(q);
        const mDet = log.detail.toLowerCase().includes(q);
        if (!mID && !mOp && !mAct && !mTgt && !mDet) return false;
      }
      return true;
    });
  }, [opLogs, game, opCategory, opStatusFilter, opSearchQuery]);

  // 筛选游戏日志
  const filteredGameLogs = useMemo(() => {
    return gameLogs.filter((log) => {
      if (game !== "全部游戏" && log.game !== game) {
        return false;
      }
      if (gameCategory !== "all" && log.category !== gameCategory) {
        return false;
      }
      if (gameLevelFilter !== "全部级别" && log.level !== gameLevelFilter) {
        return false;
      }
      if (gameSearchQuery.trim()) {
        const q = gameSearchQuery.toLowerCase();
        const mID = log.id.toLowerCase().includes(q);
        const mPName = log.playerName.toLowerCase().includes(q);
        const mPID = log.playerId.toLowerCase().includes(q);
        const mAct = log.action.toLowerCase().includes(q);
        const mDet = log.detail.toLowerCase().includes(q);
        const mSrv = log.serverId.toLowerCase().includes(q);
        const mDelta = (log.delta || "").toLowerCase().includes(q);
        if (!mID && !mPName && !mPID && !mAct && !mDet && !mSrv && !mDelta) return false;
      }
      return true;
    });
  }, [gameLogs, game, gameCategory, gameLevelFilter, gameSearchQuery]);

  // 导出操作日志 CSV
  const handleExportOpLogs = () => {
    if (filteredOpLogs.length === 0) {
      onShowToast("当前筛选条件下无操作日志记录可供导出");
      return;
    }
    const headers = ["流水号", "操作人", "操作动作", "作用对象", "执行结果", "记录时间", "详细载荷说明"];
    const rows = filteredOpLogs.map((l) => [
      l.id,
      l.operator,
      l.action,
      l.target,
      l.status,
      l.time,
      `"${l.detail.replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `xuanji_op_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`已导出 ${filteredOpLogs.length} 条操作审计日志报表`);
  };

  // 导出游戏日志 CSV
  const handleExportGameLogs = () => {
    if (filteredGameLogs.length === 0) {
      onShowToast("当前筛选条件下无游戏日志记录可供导出");
      return;
    }
    const headers = ["流水号", "所属游戏", "所在区服", "玩家ID", "玩家昵称", "事件分类", "具体行为", "数值/物品变动", "严重级别", "客户端IP", "记录时间", "详细描述"];
    const rows = filteredGameLogs.map((l) => [
      l.id,
      l.game,
      l.serverId,
      l.playerId,
      l.playerName,
      l.category,
      l.action,
      `"${(l.delta || "").replace(/"/g, '""')}"`,
      l.level,
      l.ip,
      l.time,
      `"${l.detail.replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `xuanji_game_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`已导出 ${filteredGameLogs.length} 条游戏服务器流水日志`);
  };

  // 游戏日志 KPI 计算
  const gameStats = useMemo(() => {
    const total = filteredGameLogs.length;
    const econCount = filteredGameLogs.filter((l) => l.category === "经济流水").length;
    const critCount = filteredGameLogs.filter((l) => l.level === "CRITICAL").length;
    const warnCount = filteredGameLogs.filter((l) => l.level === "WARN").length;
    return { total, econCount, critCount, warnCount };
  }, [filteredGameLogs]);

  // 操作日志 KPI 计算
  const opStats = useMemo(() => {
    const total = filteredOpLogs.length;
    const successCount = filteredOpLogs.filter((l) => l.status === "成功").length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;
    const highRiskCount = filteredOpLogs.filter(
      (l) => l.action.includes("指令") || l.action.includes("封禁") || l.action.includes("配表") || l.action.includes("召回")
    ).length;
    return { total, successRate, highRiskCount };
  }, [filteredOpLogs]);

  return (
    <div className="view-container">
      {/* 顶部主双 Tab 导航 */}
      <div className="log-module-header">
        <div className="log-main-tabs">
          <button
            type="button"
            className={`log-main-tab ${activeMainTab === "game" ? "active" : ""}`}
            onClick={() => setActiveMainTab("game")}
          >
            <Gamepad2 size={16} />
            <span>游戏日志</span>
            <span className="tab-badge">{gameLogs.length}</span>
          </button>
          <button
            type="button"
            className={`log-main-tab ${activeMainTab === "operation" ? "active" : ""}`}
            onClick={() => setActiveMainTab("operation")}
          >
            <ShieldCheck size={16} />
            <span>操作日志</span>
            <span className="tab-badge">{opLogs.length}</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={activeMainTab === "game" ? fetchGameLogs : fetchOpLogs}
            disabled={activeMainTab === "game" ? gameLoading : opLoading}
            title="刷新最新日志"
          >
            <RefreshCw size={14} className={activeMainTab === "game" ? (gameLoading ? "spin" : "") : (opLoading ? "spin" : "")} />
            <span>刷新</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={activeMainTab === "game" ? handleExportGameLogs : handleExportOpLogs}
          >
            <Download size={14} />
            <span>导出{activeMainTab === "game" ? "游戏流水" : "审计报表"}</span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: 游戏日志 ======================= */}
      {activeMainTab === "game" && (
        <>
          {/* 游戏日志 KPI 概览 */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">游戏事件总数</span>
                <span className="metric-badge primary">
                  <Activity size={14} />
                </span>
              </div>
              <div className="metric-value">
                {gameStats.total}
                <span className="metric-unit">条</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">覆盖全服行为日志与实时流水</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">经济交易流动</span>
                <span className="metric-badge positive">
                  <Coins size={14} />
                </span>
              </div>
              <div className="metric-value">
                {gameStats.econCount}
                <span className="metric-unit">笔</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">包含商城充值、珍宝阁消耗与寄售行</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">重大突破与首杀</span>
                <span className="metric-badge accent">
                  <Flame size={14} />
                </span>
              </div>
              <div className="metric-value">
                {gameStats.critCount}
                <span className="metric-unit">次</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">涵盖世界Boss斩杀、传说祈愿与境界突破</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">安全巡检预警</span>
                <span className="metric-badge warning">
                  <AlertTriangle size={14} />
                </span>
              </div>
              <div className="metric-value">
                {gameStats.warnCount}
                <span className="metric-unit">起</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">反外挂测速、内存变速与异常封包</span>
              </div>
            </div>
          </div>

          {/* 游戏日志工具栏与筛选 */}
          <div className="table-panel">
            <div className="table-header-custom" style={{ padding: "12px 16px", borderBottom: "1px solid #ede8dc" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {/* 分类药丸 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { id: "all", label: "全部事件" },
                    { id: "经济流水", label: "经济流水" },
                    { id: "玩法战斗", label: "玩法战斗" },
                    { id: "角色成长", label: "角色成长" },
                    { id: "道具获取", label: "道具获取" },
                    { id: "安全风控", label: "安全风控" },
                    { id: "登录登出", label: "登录登出" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm ${gameCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "4px 10px", fontSize: 12, borderRadius: 14 }}
                      onClick={() => setGameCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 搜索与级别过滤 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="search-input-wrapper" style={{ width: 220 }}>
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="搜索玩家/行为/流水/区服..."
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                    />
                    {gameSearchQuery && (
                      <button type="button" className="search-clear-btn" onClick={() => setGameSearchQuery("")}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <select
                    className="ancient-select"
                    value={gameLevelFilter}
                    onChange={(e) => setGameLevelFilter(e.target.value)}
                    style={{ fontSize: 12, padding: "5px 10px", minWidth: 100 }}
                  >
                    <option value="全部级别">全部级别</option>
                    <option value="INFO">INFO 常规</option>
                    <option value="WARN">WARN 预警</option>
                    <option value="CRITICAL">CRITICAL 重大</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 游戏日志表格 */}
            <div className="table-scroll">
              <table className="ancient-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>流水号</th>
                    <th style={{ width: 155 }}>记录时间</th>
                    <th style={{ width: 140 }}>游戏 / 区服</th>
                    <th style={{ width: 150 }}>玩家 (ID / 昵称)</th>
                    <th style={{ width: 110 }}>分类</th>
                    <th style={{ width: 130 }}>事件动作</th>
                    <th style={{ minWidth: 200 }}>详细描述</th>
                    <th style={{ width: 130 }}>数值变动</th>
                    <th style={{ width: 85 }}>级别</th>
                    <th style={{ width: 75, textAlign: "center" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGameLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "48px 16px", color: "#8a9c92" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <Gamepad2 size={32} style={{ opacity: 0.35 }} />
                          <span>未匹配到任何游戏日志记录</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredGameLogs.map((log) => {
                      const isPositive = (log.delta || "").startsWith("+");
                      const isNegative = (log.delta || "").startsWith("-");

                      return (
                        <tr key={log.id}>
                          <td>
                            <code style={{ fontSize: 11.5, color: "#19362a", fontWeight: 600 }}>{log.id}</code>
                          </td>
                          <td style={{ fontSize: 11.5, color: "#5d7165" }}>{log.time}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontWeight: 600, color: "#1c352f", fontSize: 12 }}>{log.game}</span>
                              <span className="server-tag">{log.serverId}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontWeight: 600, color: "#1a382c", fontSize: 12 }}>{log.playerName}</span>
                              <span style={{ fontSize: 10.5, color: "#74887d", fontFamily: "monospace" }}>{log.playerId}</span>
                            </div>
                          </td>
                          <td>
                            <span className="game-category-tag">{log.category}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: "#254638", fontSize: 12 }}>{log.action}</span>
                          </td>
                          <td>
                            <div className="log-detail-snippet" title={log.detail}>
                              {log.detail}
                            </div>
                          </td>
                          <td>
                            {log.delta ? (
                              <span
                                className={`delta-pill ${
                                  isPositive ? "positive" : isNegative ? "negative" : "neutral"
                                }`}
                              >
                                {isPositive && <ArrowUpRight size={11} style={{ marginRight: 2 }} />}
                                {isNegative && <ArrowDownRight size={11} style={{ marginRight: 2 }} />}
                                {log.delta}
                              </span>
                            ) : (
                              <span style={{ color: "#a5b4ab", fontSize: 11 }}>-</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`level-pill ${
                                log.level === "CRITICAL" ? "critical" : log.level === "WARN" ? "warn" : "info"
                              }`}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                              onClick={() => setSelectedGameLog(log)}
                            >
                              详情
                            </button>
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
                显示第 1 至 {filteredGameLogs.length} 条，共计 {filteredGameLogs.length} 条游戏服流水
              </span>
              <span style={{ fontSize: 11.5, color: "#8a9c92" }}>
                数据实时同步自各区服 GameServer 引擎
              </span>
            </div>
          </div>
        </>
      )}

      {/* ======================= TAB 2: 操作审计日志 ======================= */}
      {activeMainTab === "operation" && (
        <>
          {/* 操作日志 KPI 概览 */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">累计审计日志</span>
                <span className="metric-badge primary">
                  <Terminal size={14} />
                </span>
              </div>
              <div className="metric-value">
                {opStats.total}
                <span className="metric-unit">条</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">包含全服 GM、运营下发与系统审计</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">执行成功率</span>
                <span className="metric-badge positive">
                  <ShieldCheck size={14} />
                </span>
              </div>
              <div className="metric-value">
                {opStats.successRate}
                <span className="metric-unit">%</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">指令、广播与礼包发放成功率</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">高危审计动作</span>
                <span className="metric-badge warning">
                  <ShieldAlert size={14} />
                </span>
              </div>
              <div className="metric-value">
                {opStats.highRiskCount}
                <span className="metric-unit">项</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">封禁、配表热更、指令执行与召回</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">今日流水数</span>
                <span className="metric-badge accent">
                  <Zap size={14} />
                </span>
              </div>
              <div className="metric-value">
                {opLogs.filter((l) => l.time.includes(new Date().toISOString().slice(0, 10))).length}
                <span className="metric-unit">笔</span>
              </div>
              <div className="metric-footer">
                <span className="metric-sub">当前自然日产生的操作流水总计</span>
              </div>
            </div>
          </div>

          {/* 操作日志工具栏与筛选 */}
          <div className="table-panel">
            <div className="table-header-custom" style={{ padding: "12px 16px", borderBottom: "1px solid #ede8dc" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {/* 分类药丸 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { id: "all", label: "全部" },
                    { id: "item", label: "道具下发" },
                    { id: "broadcast", label: "全服广播" },
                    { id: "command", label: "运维调试" },
                    { id: "mail", label: "补偿信函" },
                    { id: "security", label: "安全鉴权" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm ${opCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                      style={{ padding: "4px 10px", fontSize: 12, borderRadius: 14 }}
                      onClick={() => setOpCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 搜索与状态 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="search-input-wrapper" style={{ width: 220 }}>
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="搜索操作人/流水号/目标..."
                      value={opSearchQuery}
                      onChange={(e) => setOpSearchQuery(e.target.value)}
                    />
                    {opSearchQuery && (
                      <button type="button" className="search-clear-btn" onClick={() => setOpSearchQuery("")}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <select
                    className="ancient-select"
                    value={opStatusFilter}
                    onChange={(e) => setOpStatusFilter(e.target.value)}
                    style={{ fontSize: 12, padding: "5px 10px", minWidth: 95 }}
                  >
                    <option value="全部状态">全部状态</option>
                    <option value="成功">成功</option>
                    <option value="失败">失败</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 操作日志表格 */}
            <div className="table-scroll">
              <table className="ancient-table">
                <thead>
                  <tr>
                    <th style={{ width: 130 }}>流水编号</th>
                    <th style={{ width: 120 }}>操作人</th>
                    <th style={{ width: 125 }}>动作类型</th>
                    <th style={{ width: 170 }}>作用目标</th>
                    <th style={{ minWidth: 260 }}>执行明细与载荷</th>
                    <th style={{ width: 155 }}>操作时间</th>
                    <th style={{ width: 85 }}>执行状态</th>
                    <th style={{ width: 75, textAlign: "center" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#8a9c92" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <Terminal size={32} style={{ opacity: 0.35 }} />
                          <span>未查询到匹配的操作审计日志</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOpLogs.map((log) => {
                      let pillClass = "command";
                      let PillIcon = Terminal;
                      if (log.action.includes("道具") || log.action.includes("礼盒") || log.action.includes("礼包")) {
                        pillClass = "item";
                        PillIcon = Package;
                      } else if (log.action.includes("广播") || log.action.includes("跑马灯")) {
                        pillClass = "broadcast";
                        PillIcon = Radio;
                      } else if (log.action.includes("信函") || log.action.includes("CDKey") || log.action.includes("邮件")) {
                        pillClass = "mail";
                        PillIcon = Zap;
                      } else if (log.action.includes("鉴权") || log.action.includes("封禁") || log.action.includes("登录")) {
                        pillClass = "security";
                        PillIcon = Shield;
                      }

                      return (
                        <tr key={log.id}>
                          <td>
                            <code style={{ fontSize: 11.5, color: "#19362a", fontWeight: 600 }}>{log.id}</code>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <UserCheck size={13} style={{ color: "#4f6e5e" }} />
                              <span style={{ fontWeight: 600, color: "#1c352f", fontSize: 12 }}>{log.operator}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`action-pill ${pillClass}`}>
                              <PillIcon size={12} />
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="log-target-tag" title={log.target}>
                              {log.target}
                            </span>
                          </td>
                          <td>
                            <div className="log-detail-snippet" title={log.detail}>
                              {log.detail}
                            </div>
                          </td>
                          <td style={{ fontSize: 11.5, color: "#5d7165" }}>{log.time}</td>
                          <td>
                            <StatusBadge status={log.status} />
                          </td>
                          <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                              onClick={() => setSelectedOpLog(log)}
                            >
                              详情
                            </button>
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
                显示第 1 至 {filteredOpLogs.length} 条，共计 {filteredOpLogs.length} 条操作记录
              </span>
              <span style={{ fontSize: 11.5, color: "#8a9c92" }}>
                所有写操作均受全链路安全审计追踪
              </span>
            </div>
          </div>
        </>
      )}

      {/* 弹窗 1: 游戏日志详情抽屉 */}
      {selectedGameLog && (
        <div className="modal-backdrop" onClick={() => setSelectedGameLog(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Gamepad2 size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">游戏服务器事件详情</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedGameLog(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="log-drawer-kv">
                <div className="log-kv-row">
                  <span>流水编号</span>
                  <strong>{selectedGameLog.id}</strong>
                </div>
                <div className="log-kv-row">
                  <span>所属游戏 / 区服</span>
                  <strong>{selectedGameLog.game} · {selectedGameLog.serverId}</strong>
                </div>
                <div className="log-kv-row">
                  <span>关联玩家</span>
                  <strong>{selectedGameLog.playerName} ({selectedGameLog.playerId})</strong>
                </div>
                <div className="log-kv-row">
                  <span>事件分类</span>
                  <span className="game-category-tag">{selectedGameLog.category}</span>
                </div>
                <div className="log-kv-row">
                  <span>触发动作</span>
                  <strong style={{ color: "#1f563d" }}>{selectedGameLog.action}</strong>
                </div>
                <div className="log-kv-row">
                  <span>发生时间</span>
                  <strong>{selectedGameLog.time}</strong>
                </div>
                <div className="log-kv-row">
                  <span>客户端 IP</span>
                  <code>{selectedGameLog.ip || "127.0.0.1"}</code>
                </div>
                <div className="log-kv-row">
                  <span>数值 / 道具变动</span>
                  <strong>{selectedGameLog.delta || "无直接数值流动"}</strong>
                </div>
                <div className="log-kv-row">
                  <span>严重级别</span>
                  <span
                    className={`level-pill ${
                      selectedGameLog.level === "CRITICAL"
                        ? "critical"
                        : selectedGameLog.level === "WARN"
                        ? "warn"
                        : "info"
                    }`}
                  >
                    {selectedGameLog.level}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 6 }}>
                  事件上下文与详细日志载荷
                </span>
                <div
                  style={{
                    background: "#202e27",
                    color: "#d8e6de",
                    padding: "12px 14px",
                    borderRadius: 6,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedGameLog.detail}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedGameLog(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 2: 操作审计日志详情 */}
      {selectedOpLog && (
        <div className="modal-backdrop" onClick={() => setSelectedOpLog(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">操作审计详情</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedOpLog(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="log-drawer-kv">
                <div className="log-kv-row">
                  <span>流水编号</span>
                  <strong>{selectedOpLog.id}</strong>
                </div>
                <div className="log-kv-row">
                  <span>操作人</span>
                  <strong>{selectedOpLog.operator}</strong>
                </div>
                <div className="log-kv-row">
                  <span>动作类型</span>
                  <strong>{selectedOpLog.action}</strong>
                </div>
                <div className="log-kv-row">
                  <span>作用目标</span>
                  <strong>{selectedOpLog.target}</strong>
                </div>
                <div className="log-kv-row">
                  <span>记录时间</span>
                  <strong>{selectedOpLog.time}</strong>
                </div>
                <div className="log-kv-row">
                  <span>执行状态</span>
                  <StatusBadge status={selectedOpLog.status} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 6 }}>
                  详细操作内容与执行回执
                </span>
                <div
                  style={{
                    background: "#202e27",
                    color: "#d8e6de",
                    padding: "12px 14px",
                    borderRadius: 6,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedOpLog.detail}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedOpLog(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
