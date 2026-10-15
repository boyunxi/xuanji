import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Gift,
  Megaphone,
  PackageCheck,
  PlusCircle,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Terminal,
  UserX,
  Zap,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { AncientSelect } from "../components/common/AncientSelect";
import { AncientNumberInput } from "../components/common/AncientNumberInput";
import { AncientSearchableSelect } from "../components/common/AncientSearchableSelect";
import { GiftBoxList } from "../components/gm/GiftBoxList";
import { GiftBoxModal } from "../components/gm/GiftBoxModal";
import { BoxOpenSimulatorModal } from "../components/gm/BoxOpenSimulatorModal";
import { BoxDispatchModal } from "../components/gm/BoxDispatchModal";
import { CreateItemModal } from "../components/gm/CreateItemModal";
import { predefinedGameItems } from "../constants/gameItems";
import { games } from "../constants/navigation";
import type { Game, GameItem, GiftBox, GMLog, Player } from "../types";

interface GMViewProps {
  game: Game;
  players: Player[];
  onShowToast: (msg: string) => void;
}

export function GMView({ game, players, onShowToast }: GMViewProps) {
  const [activeTab, setActiveTab] = useState<"item" | "broadcast" | "command" | "boxes" | "logs">("item");
  const [logs, setLogs] = useState<GMLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic games, items, and gift boxes from database
  const [availableGames, setAvailableGames] = useState<string[]>(games);
  const [availableItems, setAvailableItems] = useState<GameItem[]>(predefinedGameItems as any);
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);

  // Modals
  const [boxModal, setBoxModal] = useState<{ isOpen: boolean; box: GiftBox | null }>({
    isOpen: false,
    box: null,
  });
  const [simulatorModal, setSimulatorModal] = useState<{ isOpen: boolean; box: GiftBox | null }>({
    isOpen: false,
    box: null,
  });
  const [dispatchModal, setDispatchModal] = useState<{ isOpen: boolean; box: GiftBox | null }>({
    isOpen: false,
    box: null,
  });
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);

  // Form states
  // 1. Item dispatch
  const [targetPlayer, setTargetPlayer] = useState(players[0]?.id || "XJ100248");
  const [itemGame, setItemGame] = useState<string>(game === "全部游戏" ? "山海长歌" : game);
  const [itemName, setItemName] = useState("元宝");
  const [itemAmount, setItemAmount] = useState(1000);
  const [itemReason, setItemReason] = useState("运营维护补偿");

  // 2. Broadcast
  const [broadcastGame, setBroadcastGame] = useState(game);
  const [broadcastPriority, setBroadcastPriority] = useState("系统");
  const [broadcastContent, setBroadcastContent] = useState("");

  // 3. Command
  const [commandTarget, setCommandTarget] = useState("");
  const [pendingCommand, setPendingCommand] = useState<{
    command: string;
    desc: string;
    target?: string;
  } | null>(null);

  const loadLogs = async () => {
    try {
      const res = await api.getGMLogs();
      setLogs(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBoxes = async () => {
    try {
      const res = await api.getGiftBoxes();
      setGiftBoxes(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.getItems();
      if (res && res.length > 0) {
        setAvailableItems(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGames = async () => {
    try {
      const res = await api.getGames();
      if (res && res.length > 0) {
        setAvailableGames(res.map((g) => g.name));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLogs();
    loadBoxes();
    loadItems();
    loadGames();
  }, []);

  const handleSendItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetPlayer || !itemName) return;
    setLoading(true);
    try {
      const log = await api.sendGMItem({
        game: itemGame,
        playerId: targetPlayer,
        itemName,
        amount: Number(itemAmount),
        reason: itemReason,
      });
      setLogs((prev) => [log, ...prev]);
      onShowToast(`已向玩家 [${targetPlayer}] 发放 ${itemName} x${itemAmount}`);
    } catch (err: any) {
      onShowToast(`发放失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;
    setLoading(true);
    try {
      const log = await api.sendGMBroadcast({
        game: broadcastGame,
        content: broadcastContent.trim(),
        priority: broadcastPriority,
      });
      setLogs((prev) => [log, ...prev]);
      setBroadcastContent("");
      onShowToast(`[${broadcastPriority}广播] 已推送至 ${broadcastGame}`);
    } catch (err: any) {
      onShowToast(`广播失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = (command: string, desc: string, target?: string) => {
    setPendingCommand({ command, desc, target });
  };

  const handleConfirmExecuteCommand = async () => {
    if (!pendingCommand) return;
    const { command, desc, target } = pendingCommand;
    setLoading(true);
    try {
      const log = await api.executeGMCommand({
        command,
        target: target || "全服服务器",
        params: "standard",
      });
      setLogs((prev) => [log, ...prev]);
      onShowToast(`GM指令执行成功: ${desc}`);
      setPendingCommand(null);
    } catch (err: any) {
      onShowToast(`执行失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const commonItems = [
    { name: "元宝", category: "通用货币" },
    { name: "灵石", category: "修炼资源" },
    { name: "强化神石", category: "锻造材料" },
    { name: "九转金丹", category: "境界突破" },
    { name: "限定坐骑·墨麒麟", category: "外观道具" },
    { name: "太虚飞剑", category: "极品装备" },
  ];

  return (
    <div className="gm-view-container content-enter">
      {/* Sub Tabs */}
      <div className="gm-subtabs">
        <button
          className={`gm-tab-btn ${activeTab === "item" ? "active" : ""}`}
          onClick={() => setActiveTab("item")}
        >
          <Gift size={16} /> 道具货币发放
        </button>
        <button
          className={`gm-tab-btn ${activeTab === "boxes" ? "active" : ""}`}
          onClick={() => setActiveTab("boxes")}
        >
          <PackageCheck size={16} /> 定制礼盒礼包 ({giftBoxes.length})
        </button>
        <button
          className={`gm-tab-btn ${activeTab === "broadcast" ? "active" : ""}`}
          onClick={() => setActiveTab("broadcast")}
        >
          <Radio size={16} /> 全服跑马灯广播
        </button>
        <button
          className={`gm-tab-btn ${activeTab === "command" ? "active" : ""}`}
          onClick={() => setActiveTab("command")}
        >
          <Terminal size={16} /> 快捷运维指令
        </button>
        <button
          className={`gm-tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <ShieldAlert size={16} /> 操作审计日志 ({logs.length})
        </button>
      </div>

      {/* Tab 1: Item & Currency Dispatch */}
      {activeTab === "item" && (
        <div className="gm-card">
          <div className="gm-card-heading">
            <div className="section-title-line">
              <span className="title-rule" />
              <h2>玩家资源补发</h2>
            </div>
            <p>为指定区服玩家直接发放元宝、灵石或指定装备道具，操作将记录在审计流水。</p>
          </div>
          <form className="gm-form" onSubmit={handleSendItem}>
            <div className="gm-form-grid">
              <div className="form-field">
                <span>所属游戏</span>
                <AncientSelect
                  value={itemGame}
                  onChange={setItemGame}
                  options={availableGames.filter((g) => g !== "全部游戏")}
                  ariaLabel="所属游戏"
                />
              </div>
              <label className="form-field">
                <span>目标玩家 ID / 角色</span>
                <input
                  required
                  placeholder="输入玩家编号，如 XJ100248"
                  value={targetPlayer}
                  onChange={(e) => setTargetPlayer(e.target.value)}
                />
              </label>
              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span>物品 / 资源名称</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setIsCreateItemOpen(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#2d5d4c",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: 0,
                      }}
                      title="打开录入新道具弹窗"
                    >
                      <PlusCircle size={12} /> 录入新道具
                    </button>
                    <span style={{ color: "#d2cebf", fontSize: "11px" }}>|</span>
                    <button
                      type="button"
                      onClick={() => setBoxModal({ isOpen: true, box: null })}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#7e5291",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: 0,
                      }}
                      title="打开定制新礼匣弹窗"
                    >
                      <Gift size={12} /> 定制新礼匣
                    </button>
                  </div>
                </div>
                <AncientSearchableSelect
                  value={itemName}
                  onChange={setItemName}
                  options={availableItems as any}
                  placeholder="搜索或下拉挑选，支持自定义输入"
                  required
                />
              </div>
              <div className="form-field">
                <span>发放数量</span>
                <AncientNumberInput
                  min={1}
                  max={999999}
                  value={itemAmount}
                  onChange={setItemAmount}
                />
              </div>
            </div>

            <div className="gm-quick-chips">
              <span className="gm-chips-label">常用道具快捷填充：</span>
              {commonItems.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={`gm-chip ${itemName === item.name ? "active" : ""}`}
                  onClick={() => setItemName(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <label className="form-field" style={{ marginTop: "14px" }}>
              <span>发放原因（写入玩家系统邮件与审计日志）</span>
              <input
                required
                placeholder="例如：开服维护补偿 / 线上BUG回档补偿"
                value={itemReason}
                onChange={(e) => setItemReason(e.target.value)}
              />
            </label>

            <div className="gm-form-foot">
              <span className="gm-note">
                <AlertTriangle size={14} /> 发放后不可直接逆向回收，请务必核对玩家ID。
              </span>
              <button type="submit" className="primary-button" disabled={loading}>
                <Send size={15} /> 立即发放
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Broadcast / Marquee */}
      {activeTab === "broadcast" && (
        <div className="gm-card">
          <div className="gm-card-heading">
            <div className="section-title-line">
              <span className="title-rule" />
              <h2>即时滚屏广播</h2>
            </div>
            <p>向全服或指定游戏在线玩家下发滚屏跑马灯公告，适用于紧急维护、活动提示等场景。</p>
          </div>
          <form className="gm-form" onSubmit={handleSendBroadcast}>
            <div className="gm-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="form-field">
                <span>推送范围</span>
                <AncientSelect
                  value={broadcastGame}
                  onChange={(val) => setBroadcastGame(val as Game)}
                  options={availableGames}
                  ariaLabel="推送范围"
                />
              </div>
              <div className="form-field">
                <span>广播优先级</span>
                <AncientSelect
                  value={broadcastPriority}
                  onChange={setBroadcastPriority}
                  options={[
                    { value: "系统", label: "系统广播 (金色滚屏)" },
                    { value: "紧急", label: "紧急通告 (红字闪烁)" },
                    { value: "活动", label: "活动提示 (普通绿字)" },
                  ]}
                  ariaLabel="广播优先级"
                />
              </div>
            </div>

            <label className="form-field">
              <span>广播正文内容</span>
              <textarea
                rows={3}
                required
                maxLength={200}
                placeholder="输入推送给在线玩家的广播消息..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
              />
            </label>

            <div className="gm-form-foot">
              <span className="gm-note">
                <Megaphone size={14} /> 广播将立即推送至客户端顶端飘屏展示。
              </span>
              <button type="submit" className="primary-button" disabled={loading}>
                <Send size={15} /> 发送全屏广播
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Quick Ops Directives */}
      {activeTab === "command" && (
        <div className="gm-card">
          <div className="gm-card-heading">
            <div className="section-title-line">
              <span className="title-rule" />
              <h2>快捷运维控制台</h2>
            </div>
            <p>直接调用底层游戏服务器热重载、网络会话踢出与缓存控制指令。</p>
          </div>
          <div className="gm-commands-grid">
            <div className="gm-cmd-card">
              <div className="gm-cmd-head">
                <RefreshCw size={19} />
                <strong>配置表热重载</strong>
              </div>
              <p>不重启服务，重新加载怪物数值、掉落配表与商城配置。</p>
              <button
                className="secondary-button"
                onClick={() =>
                  handleExecuteCommand("reload_config", "全区服游戏掉落与数值配置表热重载")
                }
              >
                执行重载
              </button>
            </div>

            <div className="gm-cmd-card">
              <div className="gm-cmd-head">
                <Zap size={19} />
                <strong>清空跨服缓存</strong>
              </div>
              <p>清空排行榜、工会战战力及活动积分在 Redis 中的临时缓存。</p>
              <button
                className="secondary-button"
                onClick={() =>
                  handleExecuteCommand("clear_cache", "清空跨服排行榜与工会战实时内存缓存")
                }
              >
                立即清空
              </button>
            </div>

            <div className="gm-cmd-card">
              <div className="gm-cmd-head">
                <UserX size={19} />
                <strong>强制玩家下线</strong>
              </div>
              <p>阻断异常玩家会话并强制踢出游戏服。</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    padding: "6px 10px",
                    border: "1px solid #dedbcf",
                    borderRadius: "2px",
                    background: "#fbfaf7",
                  }}
                  placeholder="玩家ID，如 XJ100731"
                  value={commandTarget}
                  onChange={(e) => setCommandTarget(e.target.value)}
                />
                <button
                  className="secondary-button danger-button"
                  style={{ color: "#fff" }}
                  onClick={() => {
                    if (!commandTarget.trim()) {
                      onShowToast("请输入玩家ID");
                      return;
                    }
                    handleExecuteCommand(
                      "kick_player",
                      `强制踢出玩家 [${commandTarget}] 下线`,
                      commandTarget.trim()
                    );
                    setCommandTarget("");
                  }}
                >
                  强制踢出
                </button>
              </div>
            </div>

            <div className="gm-cmd-card">
              <div className="gm-cmd-head">
                <ShieldAlert size={19} />
                <strong>全服维护模式开关</strong>
              </div>
              <p>开启后仅允许白名单 IP / 内部测试账号进入游戏世界。</p>
              <button
                className="secondary-button"
                onClick={() =>
                  handleExecuteCommand("toggle_whitelist", "全服维护白名单模式状态切换")
                }
              >
                切换维护模式
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "logs" && (
        <div className="table-panel content-enter" style={{ marginTop: 0 }}>
          <div className="table-toolbar">
            <div className="table-title">
              <h2>GM 操作审计流水</h2>
              <span>{logs.length} 条记录</span>
            </div>
            <button className="primary-button" onClick={loadLogs}>
              <RefreshCw size={14} /> 刷新日志
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>流水编号</th>
                  <th>操作人</th>
                  <th>操作指令</th>
                  <th>作用目标</th>
                  <th>详细执行内容</th>
                  <th>执行时间</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="order-id">{log.id}</td>
                    <td>
                      <strong>{log.operator}</strong>
                    </td>
                    <td>
                      <span className="status-text quiet">{log.action}</span>
                    </td>
                    <td>{log.target}</td>
                    <td className="excerpt-cell">{log.detail}</td>
                    <td>{log.time}</td>
                    <td>
                      <StatusBadge value={log.status} />
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      暂无 GM 审计日志记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>共 {logs.length} 条操作记录</span>
            <span>严格记录于 Go 后端持久化存储</span>
          </div>
        </div>
      )}

      {/* Tab 5: Custom Gift Boxes */}
      {activeTab === "boxes" && (
        <GiftBoxList
          giftBoxes={giftBoxes}
          gameOptions={availableGames}
          onRefresh={loadBoxes}
          onOpenCreateModal={() => setBoxModal({ isOpen: true, box: null })}
          onOpenEditModal={(box) => setBoxModal({ isOpen: true, box })}
          onOpenSimulator={(box) => setSimulatorModal({ isOpen: true, box })}
          onOpenDispatch={(box) => setDispatchModal({ isOpen: true, box })}
          onOpenCreateItem={() => setIsCreateItemOpen(true)}
          onShowToast={onShowToast}
        />
      )}

      {/* Gift Box Creation / Edit Modal */}
      <GiftBoxModal
        isOpen={boxModal.isOpen}
        box={boxModal.box}
        gameOptions={availableGames}
        availableItems={availableItems}
        onClose={() => setBoxModal({ isOpen: false, box: null })}
        onSaved={() => {
          loadBoxes();
        }}
        onOpenCreateItem={() => setIsCreateItemOpen(true)}
        onShowToast={onShowToast}
      />

      {/* Box Opening Simulator Modal */}
      <BoxOpenSimulatorModal
        isOpen={simulatorModal.isOpen}
        box={simulatorModal.box}
        onClose={() => setSimulatorModal({ isOpen: false, box: null })}
        onShowToast={onShowToast}
      />

      {/* Player Dispatch Modal */}
      <BoxDispatchModal
        isOpen={dispatchModal.isOpen}
        box={dispatchModal.box}
        players={players}
        onClose={() => setDispatchModal({ isOpen: false, box: null })}
        onDispatched={() => {
          loadLogs();
        }}
        onShowToast={onShowToast}
      />

      {/* Quick Create Item Modal */}
      <CreateItemModal
        isOpen={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        onCreated={(item) => {
          setAvailableItems((prev) => [item, ...prev]);
        }}
        onShowToast={onShowToast}
      />

      {/* Custom Ancient Confirmation Dialog */}
      <ConfirmModal
        open={Boolean(pendingCommand)}
        title="执行 GM 运维指令"
        message={
          <div>
            <p style={{ margin: 0 }}>
              确定要执行指令<strong>「{pendingCommand?.desc}」</strong>吗？
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#8a968b" }}>
              此操作将直接调用底层游戏服务器接口，可能对在线玩家体验产生即时影响。
            </p>
          </div>
        }
        confirmText="确认执行"
        cancelText="放弃"
        isDanger={true}
        loading={loading}
        onConfirm={handleConfirmExecuteCommand}
        onCancel={() => setPendingCommand(null)}
      />
    </div>
  );
}
