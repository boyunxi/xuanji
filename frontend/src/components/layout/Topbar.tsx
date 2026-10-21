import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  RefreshCw,
  Search,
} from "lucide-react";
import { pageInfo } from "../../constants/navigation";
import type { Notice, PageId, UserSession } from "../../types";

interface TopbarProps {
  currentPage: PageId;
  backendConnected: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenMobile: () => void;
  onOpenSearch: () => void;
  notices: Notice[];
  onReadNotice: (notice: Notice) => void;
  onReadAllNotices: () => void;
  onOpenProfile: () => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export function Topbar({
  currentPage,
  backendConnected,
  loading,
  onRefresh,
  onOpenMobile,
  onOpenSearch,
  notices,
  onReadNotice,
  onReadAllNotices,
  onOpenProfile,
  notificationsOpen,
  setNotificationsOpen,
  profileOpen,
  setProfileOpen,
  currentUser,
  onLogout,
}: TopbarProps) {
  const selectedInfo = pageInfo[currentPage];
  const unreadCount = notices.filter((n) => !n.read).length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-button icon-button"
          aria-label="打开菜单"
          onClick={onOpenMobile}
        >
          <Menu size={21} />
        </button>
        <span className="topbar-location">{selectedInfo.group}</span>
        <ChevronRight size={14} className="breadcrumb-chevron" />
        <strong>{selectedInfo.title}</strong>
      </div>
      <div className="topbar-right">
        <span
          className="demo-tag"
          title={backendConnected ? "Go 后端服务正常运行并持久化" : "Go 后端未连接"}
          style={{ cursor: "pointer" }}
          onClick={onRefresh}
        >
          <i style={{ background: backendConnected ? "#438260" : "#c45a4a" }} />
          {backendConnected ? "Go 后端已联通" : "后端连接中..."}
          {loading && (
            <RefreshCw
              size={12}
              className="animate-spin"
              style={{ marginLeft: 4 }}
            />
          )}
        </span>
        <button className="top-search" onClick={onOpenSearch}>
          <Search size={17} strokeWidth={1.8} />
          <span>搜索功能或数据...</span>
          <kbd>Ctrl K</kbd>
        </button>
        <span className="topbar-divider" />
        <button
          className="top-icon-button"
          onClick={() => {
            setNotificationsOpen(!notificationsOpen);
            setProfileOpen(false);
          }}
          aria-label={`通知，${unreadCount}条未读`}
        >
          <Bell size={19} strokeWidth={1.75} />
          {unreadCount > 0 && <i className="notification-dot" />}
        </button>
        <button
          className="profile-trigger"
          onClick={() => {
            setProfileOpen(!profileOpen);
            setNotificationsOpen(false);
          }}
          aria-label="打开账号菜单"
        >
          <span className="profile-avatar">{currentUser?.avatar || "璇"}</span>
          <span className="profile-name">{currentUser?.name || "璇玑掌印官"}</span>
          <ChevronDown size={14} strokeWidth={1.8} />
        </button>
      </div>

      {(notificationsOpen || profileOpen) && (
        <button
          className="popover-dismiss"
          aria-label="关闭浮层"
          onClick={() => {
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
        />
      )}

      {notificationsOpen && (
        <div className="top-popover notifications-popover">
          <div className="popover-head">
            <strong>消息通知</strong>
            <button onClick={onReadAllNotices}>
              <CheckCheck size={15} />全部已读
            </button>
          </div>
          <div className="notification-list">
            {notices.map((notice) => (
              <button key={notice.id} onClick={() => onReadNotice(notice)}>
                <span className={`notification-indicator ${notice.read ? "read" : ""}`} />
                <span>
                  <strong>{notice.title}</strong>
                  <small>{notice.time}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="top-popover profile-popover">
          <div className="profile-popover-head">
            <span className="profile-avatar">{currentUser?.avatar || "璇"}</span>
            <span>
              <strong>{currentUser?.name || "璇玑掌印官"}</strong>
              <small>{currentUser?.title || "总运营执事 · 环境变量鉴权"}</small>
            </span>
          </div>
          <button
            onClick={() => {
              onOpenProfile();
              setProfileOpen(false);
            }}
          >
            查看服务状态 <ArrowRight size={15} />
          </button>
          {onLogout && (
            <button
              onClick={() => {
                setProfileOpen(false);
                onLogout();
              }}
              style={{ color: "#c45a4a", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <LogOut size={14} />
                <span>退出登录</span>
              </span>
              <ArrowRight size={14} />
            </button>
          )}
          <span className="profile-popover-foot">璇玑运营平台 · 账号环境变量保护</span>
        </div>
      )}
    </header>
  );
}
