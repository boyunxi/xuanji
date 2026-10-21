import { useState, useMemo } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Gift,
  KeyRound,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { CreateCDKeyModal } from "../components/modals/CreateCDKeyModal";
import { RedeemCDKeyModal } from "../components/modals/RedeemCDKeyModal";
import { CDKeyItemsDrawer } from "../components/modals/CDKeyItemsDrawer";
import type {
  CDKeyBatch,
  CDKeyRedemption,
  CreateCDKeyBatchRequest,
  Game,
  GameItem,
  GiftBox,
  Player,
  RedeemCDKeyResponse,
} from "../types";

interface CDKeysViewProps {
  batches: CDKeyBatch[];
  redemptions: CDKeyRedemption[];
  game: Game;
  players: Player[];
  giftBoxes?: GiftBox[];
  availableItems?: GameItem[];
  onCreateBatch: (req: CreateCDKeyBatchRequest) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onRedeem: (code: string, playerId: string) => Promise<RedeemCDKeyResponse>;
  onRefresh: () => void;
  loading: boolean;
}

export function CDKeysView({
  batches,
  redemptions,
  game,
  players,
  giftBoxes = [],
  availableItems = [],
  onCreateBatch,
  onToggleStatus,
  onRedeem,
  onRefresh,
  loading,
}: CDKeysViewProps) {
  const [activeTab, setActiveTab] = useState<"batches" | "redemptions">("batches");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("全部状态");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemPreloadCode, setRedeemPreloadCode] = useState("");
  const [drawerBatch, setDrawerBatch] = useState<CDKeyBatch | null>(null);

  // Normalization for robust camelCase/PascalCase handling
  const normalizedBatches = useMemo(() => {
    return batches.map((b: any) => ({
      id: b.id || b.ID || "",
      name: b.name || b.Name || "",
      type: b.type || b.Type || "universal",
      code: b.code || b.Code || "",
      game: b.game || b.Game || "全部游戏",
      minLevel: b.minLevel ?? b.MinLevel ?? 1,
      totalCount: b.totalCount ?? b.TotalCount ?? 1,
      usedCount: b.usedCount ?? b.UsedCount ?? 0,
      status: b.status || b.Status || "已启用",
      rewards: (b.rewards || b.Rewards || []).map((r: any) => ({
        itemId: r.itemId || r.ItemID || "",
        itemName: r.itemName || r.ItemName || "",
        category: r.category || r.Category || "",
        amount: r.amount ?? r.Amount ?? 1,
        rarity: r.rarity || r.Rarity || "普通",
        isBox: r.isBox ?? r.IsBox ?? false,
      })),
      createdAt: b.createdAt || b.CreatedAt || "",
      expiresAt: b.expiresAt || b.ExpiresAt || "",
      description: b.description || b.Description || "",
    }));
  }, [batches]);

  const normalizedRedemptions = useMemo(() => {
    return redemptions.map((r: any) => ({
      id: r.id || r.ID || 0,
      code: r.code || r.Code || "",
      batchId: r.batchId || r.BatchID || "",
      batchName: r.batchName || r.BatchName || "",
      playerId: r.playerId || r.PlayerID || "",
      playerName: r.playerName || r.PlayerName || "",
      game: r.game || r.Game || "全部游戏",
      time: r.time || r.Time || "",
      rewards: (r.rewards || r.Rewards || []).map((rw: any) => ({
        itemId: rw.itemId || rw.ItemID || "",
        itemName: rw.itemName || rw.ItemName || "",
        category: rw.category || rw.Category || "",
        amount: rw.amount ?? rw.Amount ?? 1,
        rarity: rw.rarity || rw.Rarity || "普通",
        isBox: rw.isBox ?? rw.IsBox ?? false,
      })),
    }));
  }, [redemptions]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return normalizedBatches.filter((b) => {
      if (game !== "全部游戏" && b.game !== "全部游戏" && b.game !== game) return false;
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (statusFilter !== "全部状态" && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchCode = b.code.toLowerCase().includes(q);
        const matchDesc = b.description.toLowerCase().includes(q);
        const matchID = b.id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc && !matchID) return false;
      }
      return true;
    });
  }, [normalizedBatches, game, typeFilter, statusFilter, searchQuery]);

  // Filtered Redemptions
  const filteredRedemptions = useMemo(() => {
    return normalizedRedemptions.filter((r) => {
      if (game !== "全部游戏" && r.game !== "全部游戏" && r.game !== game) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.code.toLowerCase().includes(q);
        const matchBatch = r.batchName.toLowerCase().includes(q);
        const matchPlayer =
          r.playerName.toLowerCase().includes(q) || r.playerId.toLowerCase().includes(q);
        if (!matchCode && !matchBatch && !matchPlayer) return false;
      }
      return true;
    });
  }, [normalizedRedemptions, game, searchQuery]);

  // High-level Metrics
  const activeBatchesCount = normalizedBatches.filter((b) => b.status === "已启用").length;
  const totalRedemptionsCount = normalizedBatches.reduce((acc, b) => acc + b.usedCount, 0);
  const universalCount = normalizedBatches.filter((b) => b.type === "universal").length;
  const uniqueBatches = normalizedBatches.filter((b) => b.type === "unique");
  const uniqueTotalCards = uniqueBatches.reduce((acc, b) => acc + b.totalCount, 0);
  const uniqueUsedCards = uniqueBatches.reduce((acc, b) => acc + b.usedCount, 0);
  const uniqueRate =
    uniqueTotalCards > 0 ? ((uniqueUsedCards / uniqueTotalCards) * 100).toFixed(1) : "0";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenRedeemModal = (code: string = "") => {
    setRedeemPreloadCode(code);
    setIsRedeemOpen(true);
  };

  return (
    <div className="cdkeys-view">
      {/* KPI Stats Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">生效中的CDKey批次</span>
            <Ticket size={16} className="text-[#2b5d4c]" />
          </div>
          <div className="metric-value">
            {activeBatchesCount} <small className="metric-unit">个</small>
          </div>
          <div className="metric-change positive">共 {normalizedBatches.length} 个批次</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">累计核销兑换人次</span>
            <CheckCircle2 size={16} className="text-[#2b5d4c]" />
          </div>
          <div className="metric-value">
            {totalRedemptionsCount.toLocaleString()} <small className="metric-unit">次</small>
          </div>
          <div className="metric-change positive">全服礼包触达统计</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">通用通码数量</span>
            <Sparkles size={16} className="text-[#2b5d4c]" />
          </div>
          <div className="metric-value">
            {universalCount} <small className="metric-unit">组</small>
          </div>
          <div className="metric-change neutral">VIP666 等全员通码</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">独占卡密核销率</span>
            <Layers size={16} className="text-[#2b5d4c]" />
          </div>
          <div className="metric-value">
            {uniqueRate}%
          </div>
          <div className="metric-change positive">
            已核销 {uniqueUsedCards} / {uniqueTotalCards} 张
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="subtabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`subtab-btn ${activeTab === "batches" ? "active" : ""}`}
        >
          <Ticket size={14} />
          <span>批次配置与发卡 ({normalizedBatches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("redemptions")}
          className={`subtab-btn ${activeTab === "redemptions" ? "active" : ""}`}
        >
          <CheckCircle2 size={14} />
          <span>核销兑换流水日志 ({normalizedRedemptions.length})</span>
        </button>
      </div>

      {/* Table Card Panel */}
      <div className="table-panel">
        {/* Toolbar & Filters */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-search">
              <Search size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "batches"
                    ? "搜索批次名称、兑换码、ID..."
                    : "搜索卡密、玩家姓名、ID..."
                }
              />
            </div>

            {activeTab === "batches" && (
              <>
                <div className="filter-pill-group">
                  {[
                    { id: "all", label: "全部类型" },
                    { id: "universal", label: "通用福利码" },
                    { id: "unique", label: "批量独占码" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
                      className={`filter-pill ${typeFilter === t.id ? "active" : ""}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="filter-pill-group">
                  {["全部状态", "已启用", "已停用"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`filter-pill ${statusFilter === s ? "active" : ""}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => handleOpenRedeemModal()}
              className="secondary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", fontSize: 12.5 }}
            >
              <KeyRound size={14} />
              <span>兑换码核销测试</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="primary-button"
              style={{ height: 36, padding: "0 16px", fontSize: 12.5 }}
            >
              <Plus size={15} />
              <span>新建CDKey批次</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              title="刷新数据"
              className="icon-button"
              style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #ded7ca", background: "#ffffff" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab 1: Batches List */}
        {activeTab === "batches" && (
          <div className="table-scroll">
            <table className="ancient-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>批次编号 / 通用码</th>
                  <th>批次名称与说明</th>
                  <th style={{ width: 120 }}>类型</th>
                  <th style={{ width: 110 }}>生效游戏</th>
                  <th>礼包绑定奖励</th>
                  <th style={{ width: 150 }}>核销兑换进度</th>
                  <th style={{ width: 110 }}>有效截止</th>
                  <th style={{ width: 85 }}>状态</th>
                  <th style={{ width: 210, textAlign: "right", whiteSpace: "nowrap" }}>操作</th>
                </tr>
              </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    {loading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 30 }}>
                        <RefreshCw size={16} className="animate-spin text-[#2b5d4c]" />
                        <span>正在载入CDKey批次数据...</span>
                      </div>
                    ) : (
                      "暂无符合条件的CDKey批次"
                    )}
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isUniversal = batch.type === "universal";
                  const percent =
                    batch.totalCount > 0
                      ? Math.min(100, Math.round((batch.usedCount / batch.totalCount) * 100))
                      : 0;

                  return (
                    <tr key={batch.id} className="ancient-table-row">
                      <td>
                        {isUniversal ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span className="cdkey-code-badge">{batch.code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(batch.code)}
                                title="复制通用码"
                                className="icon-btn-subtle"
                              >
                                {copiedCode === batch.code ? (
                                  <Check size={12} className="text-emerald-700" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <span className="mono-id">{batch.id}</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span className="mono-id" style={{ fontWeight: 600, color: "#1e392d" }}>{batch.id}</span>
                            <span style={{ fontSize: 10.5, color: "#8a9e91" }}>批量独占卡密</span>
                          </div>
                        )}
                      </td>

                      <td>
                        <strong style={{ color: "#19362a", fontSize: 13, fontWeight: 600, display: "block" }}>
                          {batch.name}
                        </strong>
                        {batch.description && (
                          <span style={{ fontSize: 11, color: "#78847d", display: "block", marginTop: 2 }}>
                            {batch.description}
                          </span>
                        )}
                        {batch.minLevel > 1 && (
                          <span className="level-badge" style={{ marginTop: 3, display: "inline-block" }}>
                            限制 ≥ Lv.{batch.minLevel}
                          </span>
                        )}
                      </td>

                      <td>
                        {isUniversal ? (
                          <span className="target-pill all">
                            <Sparkles size={11} /> 通用福利码
                          </span>
                        ) : (
                          <span className="target-pill player">
                            <Layers size={11} /> 批量独占码
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="game-tag">{batch.game}</span>
                      </td>

                      <td>
                        <div className="mail-attachments-preview">
                          {batch.rewards.slice(0, 3).map((r, i) => (
                            <span key={i} className={`att-tag ${r.rarity || "普通"}`}>
                              {r.isBox && <Package size={11} style={{ marginRight: 2 }} />}
                              {r.itemName} ×{r.amount}
                            </span>
                          ))}
                          {batch.rewards.length > 3 && (
                            <span className="att-tag more">+{batch.rewards.length - 3}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {isUniversal ? (
                          <div className="claim-progress-box">
                            <div className="claim-counts">
                              <strong>{batch.usedCount.toLocaleString()}</strong>
                              <span style={{ fontSize: 11, color: "#8a9e91", fontWeight: 400 }}>人已兑 (不限)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="claim-progress-box">
                            <div className="claim-counts" style={{ justifyContent: "space-between" }}>
                              <span>{batch.usedCount} / {batch.totalCount}</span>
                              <span style={{ color: "#8a9e91", fontWeight: 500 }}>{percent}%</span>
                            </div>
                            <div className="ancient-progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="time-cell">
                          {batch.expiresAt ? batch.expiresAt.split(" ")[0] : "永久有效"}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={batch.status} />
                      </td>

                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="row-actions" style={{ justifyContent: "flex-end", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {!isUniversal && (
                            <button
                              type="button"
                              onClick={() => setDrawerBatch(batch)}
                              className="action-link"
                              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              查看卡密
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenRedeemModal(isUniversal ? batch.code : "")}
                            className="action-link"
                            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                          >
                            测试
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleStatus(batch.id)}
                            className={`action-link ${batch.status === "已启用" ? "danger" : ""}`}
                            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                          >
                            {batch.status === "已启用" ? "停用" : "启用"}
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
      )}

      {/* Tab 2: Redemptions Audit Log */}
      {activeTab === "redemptions" && (
        <div className="table-scroll">
          <table className="ancient-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>流水号</th>
                <th style={{ width: 140 }}>核销时间</th>
                <th style={{ width: 160 }}>兑换码 / 卡密</th>
                <th>所属批次</th>
                <th style={{ width: 140 }}>领奖玩家</th>
                <th style={{ width: 100 }}>所属游戏</th>
                <th>派发道具物品</th>
              </tr>
            </thead>
            <tbody>
              {filteredRedemptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {loading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 30 }}>
                        <RefreshCw size={16} className="animate-spin text-[#2b5d4c]" />
                        <span>正在检索核销流水...</span>
                      </div>
                    ) : (
                      "暂无核销流水记录"
                    )}
                  </td>
                </tr>
              ) : (
                filteredRedemptions.map((red) => (
                  <tr key={red.id} className="ancient-table-row">
                    <td>
                      <span className="mono-id">#{red.id}</span>
                    </td>
                    <td>
                      <span className="time-cell">{red.time}</span>
                    </td>
                    <td>
                      <span className="mono-id" style={{ fontWeight: 600, color: "#1e392d" }}>
                        {red.code}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#19362a", fontSize: 12.5 }}>{red.batchName}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "#19362a", fontSize: 12.5, display: "block" }}>{red.playerName}</strong>
                      <div className="mono-id" style={{ fontSize: 10.5 }}>{red.playerId}</div>
                    </td>
                    <td>
                      <span className="game-tag">{red.game}</span>
                    </td>
                    <td>
                      <div className="mail-attachments-preview">
                        {red.rewards.map((rw, i) => (
                          <span key={i} className="att-tag 普通">
                            <Gift size={11} style={{ marginRight: 2, color: "#c59b27" }} />
                            {rw.itemName} ×{rw.amount}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modals & Drawers */}
      <CreateCDKeyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateBatch}
        currentGame={game}
        giftBoxes={giftBoxes}
        availableItems={availableItems}
      />

      <RedeemCDKeyModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        onRedeem={onRedeem}
        players={players}
        initialCode={redeemPreloadCode}
        batches={normalizedBatches}
      />

      <CDKeyItemsDrawer
        isOpen={Boolean(drawerBatch)}
        onClose={() => setDrawerBatch(null)}
        batch={drawerBatch}
        onRedeemCard={(code) => {
          setDrawerBatch(null);
          handleOpenRedeemModal(code);
        }}
      />
    </div>
  );
}
