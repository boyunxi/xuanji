import { useEffect, useState } from "react";
import { Check, Download, Plus, type LucideIcon } from "lucide-react";
import { api } from "./api/client";
import { ConfirmModal } from "./components/common/ConfirmModal";
import { GameSelect } from "./components/common/GameSelect";
import { RangeToggle } from "./components/common/RangeToggle";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { CommandSearchModal } from "./components/modals/CommandSearchModal";
import { ComposeModal } from "./components/modals/ComposeModal";
import { ComposeMailModal } from "./components/modals/ComposeMailModal";
import { RecordDrawer } from "./components/modals/RecordDrawer";
import { pageInfo } from "./constants/navigation";
import type {
  Announcement,
  CDKeyBatch,
  CDKeyRedemption,
  CreateCDKeyBatchRequest,
  CreateMailRequest,
  Detail,
  Event,
  Game,
  GameItem,
  GiftBox,
  Mail,
  Notice,
  Order,
  OverviewData,
  PageId,
  Player,
  RangeKey,
  SearchResultItem,
  Settings,
  SpecificGame,
  UserSession,
} from "./types";
import { exportCsv } from "./utils/format";
import { AnnouncementsView } from "./views/AnnouncementsView";
import { CDKeysView } from "./views/CDKeysView";
import { EventsView } from "./views/EventsView";
import { GMView } from "./views/GMView";
import { LoginView } from "./views/LoginView";
import { MailsView } from "./views/MailsView";
import { OrdersView } from "./views/OrdersView";
import { OverviewView } from "./views/OverviewView";
import { PlayersView } from "./views/PlayersView";
import { ReportsView } from "./views/ReportsView";
import { LogsView } from "./views/LogsView";
import { ShopView } from "./views/ShopView";
import { SettingsView } from "./views/SettingsView";

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Navigation & global filters
  const [page, setPage] = useState<PageId>("overview");
  const [game, setGame] = useState<Game>("全部区服");
  const [range, setRange] = useState<RangeKey>("week");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Domain data from Go Backend
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [mails, setMails] = useState<Mail[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [settings, setSettings] = useState<Settings>({ daily: true, orders: true, events: false });
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // Dynamic items and gift boxes for mail attachments
  const [availableItems, setAvailableItems] = useState<GameItem[]>([]);
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [isComposeMailOpen, setIsComposeMailOpen] = useState(false);

  // CDKey state
  const [cdkeyBatches, setCdkeyBatches] = useState<CDKeyBatch[]>([]);
  const [cdkeyRedemptions, setCdkeyRedemptions] = useState<CDKeyRedemption[]>([]);


  // Connection & loading state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // UI state
  const [detail, setDetail] = useState<Detail | null>(null);
  const [compose, setCompose] = useState<"event" | "announcement" | null>(null);
  const [tableQuery, setTableQuery] = useState("");
  const [tableStatus, setTableStatus] = useState("全部状态");
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

  const selectedInfo = pageInfo[page];

  // Refresh all state from Go backend
  const refreshAllData = async () => {
    if (!api.getToken()) return;
    try {
      setLoading(true);
      const [ovData, plData, evData, anData, orData, noData, stData, mlData, itData, bxData, cdkBatches, cdkReds] =
        await Promise.all([
          api.getOverview(game, range),
          api.getPlayers(game),
          api.getEvents(game),
          api.getAnnouncements(game),
          api.getOrders(game),
          api.getNotices(),
          api.getSettings(),
          api.getMails(game),
          api.getItems().catch(() => []),
          api.getGiftBoxes().catch(() => []),
          api.getCDKeyBatches({ game }).catch(() => []),
          api.getCDKeyRedemptions({ game }).catch(() => []),
        ]);
      setOverview(ovData);
      setPlayers(plData);
      setEvents(evData);
      setAnnouncements(anData);
      setOrders(orData);
      setNotices(noData);
      setSettings(stData);
      setMails(mlData);
      if (itData && itData.length > 0) setAvailableItems(itData);
      if (bxData && bxData.length > 0) setGiftBoxes(bxData);
      setCdkeyBatches(cdkBatches);
      setCdkeyRedemptions(cdkReds);
      setBackendConnected(true);
    } catch (err: any) {
      console.error("Failed to load data from Go backend:", err);
      setBackendConnected(false);
      setToast("后端通信异常，请确认 Go 服务已启动");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMail = async (req: CreateMailRequest) => {
    try {
      const created = await api.createMail(req);
      setMails((prev) => [created, ...prev]);
      setToast(req.isDraft ? "信函草稿已妥善保存" : "补偿信函已成功签印下发全服");
    } catch (err: any) {
      setToast(`下发信函失败: ${err.message}`);
      throw err;
    }
  };

  const handleRecallMail = async (id: string) => {
    try {
      const recalled = await api.recallMail(id);
      setMails((prev) => prev.map((m) => (m.id === id ? recalled : m)));
      setToast("信函已紧急撤回，未领取的玩家无法再领取物资");
    } catch (err: any) {
      setToast(`撤回失败: ${err.message}`);
    }
  };

  const handleDeleteMail = async (id: string) => {
    try {
      await api.deleteMail(id);
      setMails((prev) => prev.filter((m) => m.id !== id));
      setToast("信函记录已彻底删除");
    } catch (err: any) {
      setToast(`删除失败: ${err.message}`);
    }
  };

  const handleCreateCDKeyBatch = async (req: CreateCDKeyBatchRequest) => {
    try {
      const created = await api.createCDKeyBatch(req);
      setCdkeyBatches((prev) => [created, ...prev]);
      setToast(
        req.type === "universal"
          ? `通用福利码 [${created.code}] 创建成功`
          : `批量独占卡密已成功生成 ${created.totalCount} 张`
      );
    } catch (err: any) {
      setToast(`创建CDKey批次失败: ${err.message}`);
      throw err;
    }
  };

  const handleToggleCDKeyBatchStatus = async (id: string) => {
    try {
      const updated = await api.toggleCDKeyBatchStatus(id);
      setCdkeyBatches((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setToast(`兑换码批次已切换为 [${updated.status}]`);
    } catch (err: any) {
      setToast(`状态切换失败: ${err.message}`);
    }
  };

  const handleRedeemCDKey = async (code: string, playerId: string) => {
    try {
      const res = await api.redeemCDKey({
        code,
        playerId,
        game: game !== "全部游戏" ? game : undefined,
      });
      setToast(res.message);
      // Refresh batches & redemptions to update counts
      const [bList, rList] = await Promise.all([
        api.getCDKeyBatches({ game }),
        api.getCDKeyRedemptions({ game }),
      ]);
      setCdkeyBatches(bList);
      setCdkeyRedemptions(rList);
      return res;
    } catch (err: any) {
      throw err;
    }
  };


  // 1. Initial auth verification
  useEffect(() => {
    api.onUnauthorized(() => {
      setCurrentUser(null);
      setToast("鉴印已失效或未授权，请重新登录");
    });

    const verifySession = async () => {
      const token = api.getToken();
      if (!token) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch {
        api.clearToken();
        setCurrentUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    verifySession();
  }, []);

  // 2. Fetch data when user is authenticated or filters change
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, game, range]);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setToast("已安全退出璇玑运营司");
  };

  // Global search trigger
  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(async () => {
      try {
        const results = await api.search(globalQuery);
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed:", e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [globalQuery, searchOpen]);

  // Navigation helper
  const navigate = (target: PageId) => {
    setPage(target);
    setTableQuery("");
    setTableStatus("全部状态");
    setMobileOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keyboard shortcut Ctrl+K / ESC
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setGlobalQuery("");
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setDetail(null);
        setCompose(null);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Toast timer
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Filtered lists
  const matchesGame = (itemGame: Game | string) =>
    game === "全部区服" || game === "全部游戏" || itemGame === game;
  const matchesQuery = (...values: string[]) =>
    values.some((val) => val.toLowerCase().includes(tableQuery.trim().toLowerCase()));

  const filteredPlayers = players.filter(
    (p) => matchesGame(p.game) && (tableStatus === "全部状态" || p.status === tableStatus) && matchesQuery(p.name, p.id)
  );
  const filteredEvents = events.filter(
    (e) => matchesGame(e.game) && (tableStatus === "全部状态" || e.status === tableStatus) && matchesQuery(e.title, e.id)
  );
  const filteredAnnouncements = announcements.filter(
    (a) => matchesGame(a.game) && (tableStatus === "全部状态" || a.status === tableStatus) && matchesQuery(a.title, a.id)
  );
  const filteredOrders = orders.filter(
    (o) => matchesGame(o.game) && (tableStatus === "全部状态" || o.status === tableStatus) && matchesQuery(o.player, o.id)
  );

  // Handlers for mutations
  const handleComposeSubmit = async (data: {
    title: string;
    game: SpecificGame;
    start?: string;
    content?: string;
  }) => {
    try {
      if (compose === "event" && data.start) {
        const created = await api.createEvent({
          title: data.title,
          game: data.game,
          start: data.start,
        });
        setEvents((prev) => [created, ...prev]);
        setToast(`活动「${created.title}」已创建，已持久化至 Go 后端`);
      } else if (compose === "announcement" && data.content !== undefined) {
        const created = await api.createAnnouncement({
          title: data.title,
          game: data.game,
          content: data.content,
        });
        setAnnouncements((prev) => [created, ...prev]);
        setToast(`公告草稿已保存至 Go 后端`);
      }
      setCompose(null);
      setTableQuery("");
      setTableStatus("全部状态");
      api.getOverview(game, range).then(setOverview).catch(console.error);
    } catch (err: any) {
      setToast(`创建失败: ${err.message}`);
    }
  };

  const handleTogglePlayerBan = async (player: Player) => {
    const newStatus = player.status === "正常" ? "已封禁" : "正常";
    try {
      const updated = await api.updatePlayerStatus(player.id, newStatus);
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setToast(newStatus === "正常" ? "账号已解除封禁" : "账号已封禁并持久化");
      setDetail(null);
    } catch (err: any) {
      setToast(`操作失败: ${err.message}`);
    }
  };

  const handleToggleEventStatus = async (item: Event) => {
    const newStatus = item.status === "未开始" ? "进行中" : "已结束";
    try {
      const updated = await api.updateEventStatus(item.id, newStatus);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setToast(newStatus === "进行中" ? "活动已正式开启" : "活动已标记结束");
      setDetail(null);
      api.getOverview(game, range).then(setOverview).catch(console.error);
    } catch (err: any) {
      setToast(`操作失败: ${err.message}`);
    }
  };

  const handleToggleAnnouncementStatus = async (ann: Announcement) => {
    const newStatus = ann.status === "草稿" ? "已发布" : "草稿";
    try {
      const updated = await api.updateAnnouncementStatus(ann.id, newStatus);
      setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setToast(newStatus === "已发布" ? "公告已正式发布至各服" : "公告已撤回为草稿");
      setDetail(null);
    } catch (err: any) {
      setToast(`操作失败: ${err.message}`);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setDeletingAnnouncementId(id);
  };

  const handleConfirmDeleteAnnouncement = async () => {
    if (!deletingAnnouncementId) return;
    try {
      await api.deleteAnnouncement(deletingAnnouncementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingAnnouncementId));
      setToast("公告已彻底删除");
      setDetail(null);
      setDeletingAnnouncementId(null);
    } catch (err: any) {
      setToast(`删除失败: ${err.message}`);
    }
  };

  const handleConfirmOrder = async (order: Order) => {
    try {
      const updated = await api.updateOrderStatus(order.id, "成功");
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setToast(`订单 ${order.id} 已确认支付成功`);
      setDetail(null);
      api.getOverview(game, range).then(setOverview).catch(console.error);
    } catch (err: any) {
      setToast(`操作失败: ${err.message}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setToast("设置已保存至 Go 后端存储");
    } catch (err: any) {
      setToast(`保存设置失败: ${err.message}`);
    }
  };

  const handleReadAllNotices = async () => {
    try {
      await api.markAllNoticesRead();
      setNotices((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReadNotice = async (notice: Notice) => {
    try {
      await api.markNoticeRead(notice.id);
      setNotices((prev) => prev.map((n) => (n.id === notice.id ? { ...n, read: true } : n)));
      navigate(notice.page);
    } catch (e) {
      console.error(e);
      navigate(notice.page);
    }
  };

  const exportOrders = () => {
    exportCsv(
      "璇玑-充值订单.csv",
      ["订单编号", "玩家", "游戏", "金额", "支付方式", "时间", "状态"],
      filteredOrders.map((o) => [o.id, o.player, o.game, o.amount, o.method, o.time, o.status])
    );
    setToast("订单记录已导出为 CSV");
  };

  const exportReport = () => {
    if (!overview) return;
    exportCsv(
      "璇玑-运营报表.csv",
      ["日期/时间", "所属游戏", "活跃玩家数"],
      overview.trend.labels.map((lbl, idx) => [lbl, game, Math.round(overview.trend.values[idx] || 0)])
    );
    setToast("运营报表已导出为 CSV");
  };

  const actionButton = (label: string, onClick: () => void, Icon: LucideIcon = Plus) => (
    <button className="primary-button heading-button" onClick={onClick}>
      <Icon size={16} strokeWidth={1.9} />
      {label}
    </button>
  );

  // Loading state while checking authentication token
  if (!authChecked) {
    return (
      <div className="login-wrapper">
        <div className="login-seal-container" style={{ flexDirection: "column", gap: 16 }}>
          <span className="login-seal animate-pulse" style={{ width: 56, height: 56, fontSize: 28 }}>璇</span>
          <span style={{ color: "#5a6f64", fontSize: 13.5 }}>正在鉴印核验中...</span>
        </div>
      </div>
    );
  }

  // Not logged in: show Ancient Aesthetic Login View
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setToast(`恭迎 ${user.name} 执事入座`);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`main-area ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Topbar
          currentPage={page}
          backendConnected={backendConnected}
          loading={loading}
          onRefresh={refreshAllData}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenSearch={() => {
            setGlobalQuery("");
            setSearchOpen(true);
          }}
          notices={notices}
          onReadNotice={handleReadNotice}
          onReadAllNotices={handleReadAllNotices}
          onOpenProfile={() => setDetail({ type: "profile" })}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="main-content">
          <div className="page-heading">
            <div className="page-heading-copy">
              <h1>{selectedInfo.title}</h1>
              <p>{selectedInfo.description}</p>
            </div>
            <div className="heading-controls">
              {page !== "settings" && <GameSelect value={game} onChange={setGame} />}
              {(page === "overview" || page === "reports") && (
                <RangeToggle value={range} onChange={setRange} />
              )}
              {page === "mails" && actionButton("起草信函", () => setIsComposeMailOpen(true))}
              {page === "events" && actionButton("新建活动", () => setCompose("event"))}
              {page === "announcements" && actionButton("新建公告", () => setCompose("announcement"))}
              {page === "orders" && actionButton("导出订单", exportOrders, Download)}
              {page === "reports" && actionButton("导出报表", exportReport, Download)}
            </div>
          </div>

          {page === "overview" && (
            <OverviewView
              overview={overview}
              range={range}
              game={game}
              onNavigate={navigate}
              onResetGameAndNavigate={(target) => {
                setGame("全部区服");
                navigate(target);
              }}
            />
          )}

          {page === "players" && (
            <PlayersView
              players={filteredPlayers}
              query={tableQuery}
              onQueryChange={setTableQuery}
              status={tableStatus}
              onStatusChange={setTableStatus}
              onSelectPlayer={(id) => setDetail({ type: "player", id })}
              onPlayersChange={setPlayers}
              onShowToast={setToast}
            />
          )}

          {page === "mails" && (
            <MailsView
              mails={mails}
              game={game}
              onCompose={() => setIsComposeMailOpen(true)}
              onRecall={handleRecallMail}
              onDelete={handleDeleteMail}
              onSelectDetail={(id) => setDetail({ type: "mail", id })}
              loading={loading}
            />
          )}

          {page === "cdkeys" && (
            <CDKeysView
              batches={cdkeyBatches}
              redemptions={cdkeyRedemptions}
              game={game}
              players={players}
              giftBoxes={giftBoxes}
              availableItems={availableItems}
              onCreateBatch={handleCreateCDKeyBatch}
              onToggleStatus={handleToggleCDKeyBatchStatus}
              onRedeem={handleRedeemCDKey}
              onRefresh={refreshAllData}
              loading={loading}
            />
          )}


          {page === "shop" && (
            <ShopView onShowToast={setToast} game={game} />
          )}

          {page === "events" && (
            <EventsView
              events={events}
              onEventsChange={setEvents}
              onShowToast={setToast}
              game={game}
              onSelectEvent={(id) => setDetail({ type: "event", id })}
            />
          )}

          {page === "announcements" && (
            <AnnouncementsView
              announcements={filteredAnnouncements}
              query={tableQuery}
              onQueryChange={setTableQuery}
              status={tableStatus}
              onStatusChange={setTableStatus}
              onSelectAnnouncement={(id) => setDetail({ type: "announcement", id })}
            />
          )}

          {page === "gm" && (
            <GMView game={game} players={players} onShowToast={setToast} />
          )}

          {page === "orders" && (
            <OrdersView
              orders={filteredOrders}
              query={tableQuery}
              onQueryChange={setTableQuery}
              status={tableStatus}
              onStatusChange={setTableStatus}
              onSelectOrder={(id) => setDetail({ type: "order", id })}
            />
          )}

          {page === "reports" && <ReportsView overview={overview} range={range} />}

          {page === "logs" && (
            <LogsView onShowToast={setToast} game={game} />
          )}

          {page === "settings" && (
            <SettingsView
              settings={settings}
              onSettingChange={(k, v) => setSettings((cur) => ({ ...cur, [k]: v }))}
              onSave={handleSaveSettings}
            />
          )}

          <footer className="page-footer">
            <span>© {new Date().getFullYear()} 璇玑运营平台 · React + Go 模块化全栈架构</span>
            <span>数据由 Go 后端实时持久化驱动</span>
          </footer>
        </main>
      </div>

      <CommandSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={globalQuery}
        onQueryChange={setGlobalQuery}
        results={searchResults}
        onSelectResult={(result) => {
          navigate(result.page);
          if (result.type === "player" && result.id) {
            setDetail({ type: "player", id: result.id });
          } else if (result.type === "event" && result.id) {
            setDetail({ type: "event", id: result.id });
          } else if (result.type === "mail" && result.id) {
            setDetail({ type: "mail", id: result.id });
          } else if (result.type === "cdkey" && result.id) {
            setDetail({ type: "cdkey", id: result.id });
          }
        }}
      />

      <ComposeModal
        mode={compose}
        onClose={() => setCompose(null)}
        defaultGame={game}
        onSubmit={handleComposeSubmit}
      />

      <RecordDrawer
        detail={detail}
        onClose={() => setDetail(null)}
        players={players}
        events={events}
        announcements={announcements}
        orders={orders}
        mails={mails}
        cdkeyBatches={cdkeyBatches}
        backendConnected={backendConnected}
        onTogglePlayerBan={handleTogglePlayerBan}
        onToggleEventStatus={handleToggleEventStatus}
        onToggleAnnouncementStatus={handleToggleAnnouncementStatus}
        onDeleteAnnouncement={handleDeleteAnnouncement}
        onConfirmOrder={handleConfirmOrder}
        onRecallMail={handleRecallMail}
        onDeleteMail={handleDeleteMail}
      />

      <ComposeMailModal
        isOpen={isComposeMailOpen}
        onClose={() => setIsComposeMailOpen(false)}
        onSubmit={handleCreateMail}
        currentGame={game}
        players={players}
        giftBoxes={giftBoxes}
        availableItems={availableItems}
      />


      <ConfirmModal
        open={Boolean(deletingAnnouncementId)}
        title="删除公告"
        message={
          <div>
            <p style={{ margin: 0 }}>确定要彻底删除该公告吗？</p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#8a968b" }}>
              此操作将直接从后端数据库中移除该公告记录，不可逆回。
            </p>
          </div>
        }
        confirmText="确认删除"
        cancelText="保留公告"
        isDanger={true}
        onConfirm={handleConfirmDeleteAnnouncement}
        onCancel={() => setDeletingAnnouncementId(null)}
      />

      {toast && (
        <div className="toast" role="status">
          <Check size={16} strokeWidth={2.2} />
          {toast}
        </div>
      )}
    </div>
  );
}
