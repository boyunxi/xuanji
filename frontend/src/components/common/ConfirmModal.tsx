import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  isDanger = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && !loading) {
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel, onConfirm, loading]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={onCancel}
      role="presentation"
      style={{ zIndex: 10000 }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="confirm-close-btn"
          aria-label="关闭"
          onClick={onCancel}
          type="button"
        >
          <X size={16} />
        </button>

        <div className="confirm-body">
          <div className={`confirm-icon-seal ${isDanger ? "danger" : "normal"}`}>
            {isDanger ? (
              <AlertTriangle size={24} strokeWidth={2} />
            ) : (
              <HelpCircle size={24} strokeWidth={2} />
            )}
          </div>
          <div className="confirm-text">
            <h3 id="confirm-dialog-title">{title}</h3>
            <div id="confirm-dialog-desc" className="confirm-desc">
              {message}
            </div>
          </div>
        </div>

        <div className="confirm-actions">
          <button
            type="button"
            className="secondary-button confirm-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`primary-button confirm-btn ${isDanger ? "danger-button" : ""}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? "处理中..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
