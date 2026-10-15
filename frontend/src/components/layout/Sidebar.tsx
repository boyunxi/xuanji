import { useState } from "react";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { navGroups } from "../../constants/navigation";
import type { PageId } from "../../types";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import { SidebarLandscape } from "./SidebarLandscape";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  useBodyScrollLock(mobileOpen);

  // Accordion state for sub-menus (e.g. 运营管理, 工作台, etc.)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupLabel: string) => {
    if (collapsed) {
      // If entire sidebar is collapsed, clicking expands the sidebar
      onToggleCollapse();
      return;
    }
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  return (
    <>
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          aria-label="关闭菜单"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-inner">
          {/* Brand seal & title */}
          <button
            className="brand"
            onClick={() => onNavigate("overview")}
            aria-label="璇玑，返回运营总览"
            title="璇玑 · 运营总览"
          >
            <span className="brand-seal">璇</span>
            {!collapsed && (
              <span className="brand-word">
                <strong>璇玑</strong>
                <small>XUANJI OPERATIONS</small>
              </span>
            )}
          </button>

          {/* Sidebar Collapse Toggle Button */}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.8} />
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                <PanelLeftClose size={15} strokeWidth={1.8} />
                <span>收起侧栏</span>
              </span>
            )}
          </button>

          <div className="brand-divider">
            <span />
          </div>

          {/* Navigation with Collapsible Groups */}
          <nav className="side-nav" aria-label="主导航">
            {navGroups.map((group) => {
              const isGroupCollapsed = Boolean(collapsedGroups[group.label]);
              return (
                <div className="nav-group" key={group.label}>
                  {!collapsed && (
                    <button
                      type="button"
                      className="nav-group-header"
                      onClick={() => toggleGroup(group.label)}
                      title={`点击${isGroupCollapsed ? "展开" : "折叠"}「${group.label}」`}
                    >
                      <span className="nav-group-label">{group.label}</span>
                      <ChevronDown
                        size={13}
                        className={`nav-group-chevron ${isGroupCollapsed ? "is-collapsed" : ""}`}
                      />
                    </button>
                  )}

                  {/* Child Items */}
                  {(!isGroupCollapsed || collapsed) && (
                    <div className="nav-group-items">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            className={`nav-item ${isActive ? "active" : ""}`}
                            onClick={() => onNavigate(item.id)}
                            aria-current={isActive ? "page" : undefined}
                            title={collapsed ? item.label : undefined}
                          >
                            <Icon size={18} strokeWidth={1.7} />
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && isActive && <span className="nav-active-mark" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer & landscape art */}
          <div className="sidebar-bottom">
            {!collapsed && <SidebarLandscape />}
            {!collapsed && (
              <div className="sidebar-motto">
                <span>知微见著</span>
                <i />
                <span>运筹有度</span>
              </div>
            )}
            <div className="sidebar-version">
              {!collapsed ? (
                <>
                  璇玑 · Go+React 全栈 <span>v1.0</span>
                </>
              ) : (
                <span style={{ margin: "0 auto", fontSize: "9px" }}>v1.0</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
