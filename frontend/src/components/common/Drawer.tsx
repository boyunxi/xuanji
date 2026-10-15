import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X, type LucideIcon } from "lucide-react";

interface DrawerAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface DrawerSecondaryAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: LucideIcon;
}

interface DrawerProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  action?: DrawerAction;
  secondaryAction?: DrawerSecondaryAction;
}

import { useBodyScrollLock } from "../../utils/useBodyScrollLock";

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  action,
  secondaryAction,
}: DrawerProps) {
  useBodyScrollLock(true);

  return createPortal(
    <div className="overlay-layer" role="presentation" onMouseDown={onClose} style={{ zIndex: 10000 }}>
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-top">
          <span>记录详情</span>
          <button className="icon-button" aria-label="关闭详情" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="drawer-heading">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="drawer-body">{children}</div>
        {(action || secondaryAction) && (
          <div
            className="drawer-bottom"
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            {secondaryAction && (
              <button
                className={`secondary-button ${secondaryAction.danger ? "danger-button" : ""}`}
                onClick={secondaryAction.onClick}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {secondaryAction.icon && <secondaryAction.icon size={15} />}
                {secondaryAction.label}
              </button>
            )}
            {action && (
              <button
                className={`primary-button ${action.danger ? "danger-button" : ""}`}
                onClick={action.onClick}
              >
                {action.label}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
