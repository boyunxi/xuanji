import { useState, useEffect } from "react";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  RefreshCw,
  Search,
  X,
  Layers,
} from "lucide-react";
import { api } from "../../api/client";
import type { CDKeyBatch, CDKeyItem } from "../../types";

interface CDKeyItemsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  batch: CDKeyBatch | null;
  onRedeemCard?: (code: string) => void;
}

export function CDKeyItemsDrawer({
  isOpen,
  onClose,
  batch,
  onRedeemCard,
}: CDKeyItemsDrawerProps) {
  const [items, setItems] = useState<CDKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      loadItems();
    }
  }, [isOpen, batch]);

  const loadItems = async () => {
    if (!batch) return;
    setLoading(true);
    try {
      const data = await api.getCDKeyItems(batch.id);
      setItems(data);
    } catch (err) {
      console.error("Failed to load cdkey items:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !batch) return null;

  const filteredItems = items.filter((it) => {
    if (statusFilter !== "全部" && it.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        it.code.toLowerCase().includes(q) ||
        (it.playerId && it.playerId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await api.exportCDKeyItemsCSV(batch.id, `${batch.name}_${batch.id}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const usedCount = items.filter((it) => it.status === "已兑换").length;
  const unusedCount = items.filter((it) => it.status === "待兑换").length;
  const rate = items.length > 0 ? ((usedCount / items.length) * 100).toFixed(1) : "0";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#fcfbf7] border-l border-[#d6cfc7] shadow-2xl flex flex-col h-full animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d9] bg-[#f6f3ee]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-900/10 flex items-center justify-center text-purple-900">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#1c352f] flex items-center gap-2">
                <span>{batch.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                  {batch.id}
                </span>
              </h2>
              <p className="text-xs text-[#8a928c]">独占卡密明细清单 · 一码一兑核销追踪</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8a928c] hover:text-[#1c352f] rounded-md hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="px-6 py-3 bg-[#f5f2eb] border-b border-[#e2dcd2] grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-white rounded border border-[#e2dcd2]">
            <div className="text-[11px] text-[#8a928c]">总发卡数</div>
            <div className="text-sm font-semibold text-[#1c352f]">{items.length}</div>
          </div>
          <div className="p-2 bg-white rounded border border-[#e2dcd2]">
            <div className="text-[11px] text-[#8a928c]">已兑换</div>
            <div className="text-sm font-semibold text-emerald-700">{usedCount}</div>
          </div>
          <div className="p-2 bg-white rounded border border-[#e2dcd2]">
            <div className="text-[11px] text-[#8a928c]">待兑换</div>
            <div className="text-sm font-semibold text-amber-700">{unusedCount}</div>
          </div>
          <div className="p-2 bg-white rounded border border-[#e2dcd2]">
            <div className="text-[11px] text-[#8a928c]">核销比例</div>
            <div className="text-sm font-semibold text-[#1c352f]">{rate}%</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-[#e8e2d9] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {["全部", "待兑换", "已兑换"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === status
                    ? "bg-[#1c352f] text-white font-medium"
                    : "bg-white text-[#5a6860] border border-[#d6cfc7] hover:bg-neutral-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a928c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索卡密或玩家ID..."
                className="pl-8 pr-3 py-1 bg-white border border-[#d6cfc7] rounded text-xs focus:outline-none focus:border-[#1c352f] w-48"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting || items.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#d6cfc7] text-[#1c352f] hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "导出中..." : "导出 CSV"}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#8a928c] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              正在加载卡密清单...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8a928c]">
              暂未找到符合条件的卡密
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2dcd2] text-[#8a928c] font-medium">
                  <th className="py-2">卡密代码</th>
                  <th className="py-2">状态</th>
                  <th className="py-2">兑换玩家</th>
                  <th className="py-2">兑换时间</th>
                  <th className="py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece3]">
                {filteredItems.map((it) => (
                  <tr key={it.code} className="hover:bg-[#f6f3ee] transition-colors">
                    <td className="py-2.5 font-mono font-semibold text-[#1c352f]">
                      {it.code}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          it.status === "待兑换"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                        }`}
                      >
                        {it.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#5a6860] font-mono">
                      {it.playerId || "-"}
                    </td>
                    <td className="py-2.5 text-[#8a928c] text-[11px]">
                      {it.usedAt || "-"}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(it.code)}
                          title="复制卡密"
                          className="p-1 text-[#5a6860] hover:text-[#1c352f] rounded hover:bg-black/5"
                        >
                          {copiedCode === it.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {it.status === "待兑换" && onRedeemCard && (
                          <button
                            type="button"
                            onClick={() => onRedeemCard(it.code)}
                            className="px-2 py-0.5 text-[10px] bg-emerald-800 text-white rounded hover:bg-emerald-900"
                          >
                            去核销
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e8e2d9] bg-[#f6f3ee] flex items-center justify-between text-xs text-[#8a928c]">
          <span>有效截至：{batch.expiresAt}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#d6cfc7] text-[#5a6860] hover:bg-neutral-50 rounded text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
