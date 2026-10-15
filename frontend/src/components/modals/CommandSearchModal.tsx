import { createPortal } from "react-dom";
import { Activity, ArrowRight, LayoutDashboard, Search, UsersRound, X } from "lucide-react";
import type { SearchResultItem } from "../../types";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchResultItem[];
  onSelectResult: (result: SearchResultItem) => void;
}

export function CommandSearchModal({
  open,
  onClose,
  query,
  onQueryChange,
  results,
  onSelectResult,
}: CommandSearchModalProps) {
  useBodyScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div className="search-overlay" onMouseDown={onClose} style={{ zIndex: 10000 }}>
      <div
        className="command-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="搜索功能"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="command-input">
          <Search size={20} strokeWidth={1.8} />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索模块、玩家或活动..."
          />
          <button onClick={onClose} aria-label="关闭搜索">
            <X size={18} />
          </button>
        </div>
        <div className="command-results">
          <div className="command-label">
            {query ? "搜索结果 (Go 后端检索)" : "快速前往"}
          </div>
          {results.length ? (
            results.map((result, index) => {
              return (
                <button
                  key={`${result.title}-${index}`}
                  onClick={() => onSelectResult(result)}
                >
                  <span className="command-result-icon">
                    {result.type === "player" ? (
                      <UsersRound size={17} />
                    ) : result.type === "event" ? (
                      <Activity size={17} />
                    ) : (
                      <LayoutDashboard size={17} />
                    )}
                  </span>
                  <span>
                    <strong>{result.title}</strong>
                    <small>{result.subtitle}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              );
            })
          ) : (
            <div className="command-empty">没有找到相关内容</div>
          )}
        </div>
        <div className="command-footer">
          <span>点击结果打开</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
