import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Gift,
  KeyRound,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { AncientSelect } from "../common/AncientSelect";
import type { CDKeyBatch, Player, RedeemCDKeyResponse } from "../../types";

interface RedeemCDKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string, playerId: string) => Promise<RedeemCDKeyResponse>;
  players: Player[];
  initialCode?: string;
  batches?: CDKeyBatch[];
}

export function RedeemCDKeyModal({
  isOpen,
  onClose,
  onRedeem,
  players,
  initialCode = "",
  batches = [],
}: RedeemCDKeyModalProps) {
  const [code, setCode] = useState(initialCode);
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || "XJ100248");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemCDKeyResponse | null>(null);

  if (!isOpen) return null;

  const currentPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError("请输入兑换码");
      return;
    }
    if (!selectedPlayerId) {
      setError("请选择兑换目标玩家");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await onRedeem(code.trim().toUpperCase(), selectedPlayerId);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "核销兑换失败");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (c: string) => {
    setCode(c);
    setError(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#fcfbf7] border border-[#d6cfc7] rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d9] bg-[#f6f3ee]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-900/10 flex items-center justify-center text-emerald-800">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#1c352f]">CDKey 核销与兑换测试</h2>
              <p className="text-xs text-[#8a928c]">
                模拟游戏端向运营服务器发起兑换请求，校验规则与防刷机制
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8a928c] hover:text-[#1c352f] rounded-md hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[#2d4038]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Result View */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{result.message}</span>
              </div>
              <div className="text-xs text-emerald-700 space-y-1">
                <div>所属批次：{result.batchName}</div>
                <div>核销时间：{result.time}</div>
                <div>发放道具奖励：</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.rewards.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium border border-emerald-200"
                    >
                      <Gift className="w-3 h-3 text-amber-600" />
                      {r.itemName} x{r.amount}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Player Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1c352f] mb-1">
              测试玩家账号 <span className="text-red-500">*</span>
            </label>
            <AncientSelect
              value={selectedPlayerId}
              onChange={(val) => {
                setSelectedPlayerId(val);
                setResult(null);
                setError(null);
              }}
              options={players.map((p) => ({
                label: `${p.name} (${p.id}) · Lv.${p.level} · ${p.game}`,
                value: p.id,
              }))}
              className="w-full text-xs"
            />
            {currentPlayer && (
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#78847d] bg-[#f5f2eb] px-2.5 py-1 rounded">
                <span>所属游戏: <strong className="text-[#1c352f]">{currentPlayer.game}</strong></span>
                <span>等级: <strong className="text-[#1c352f]">Lv.{currentPlayer.level}</strong></span>
                <span>账号状态: <strong className={currentPlayer.status === "已封禁" ? "text-red-600" : "text-emerald-700"}>{currentPlayer.status}</strong></span>
              </div>
            )}
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-xs font-semibold text-[#1c352f] mb-1">
              兑换码 / 卡密 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setResult(null);
                setError(null);
              }}
              placeholder="请输入通用码 (如 VIP666) 或独占卡密"
              className="w-full font-mono uppercase font-semibold tracking-wider px-3.5 py-2.5 bg-white border border-[#d6cfc7] rounded-md focus:outline-none focus:border-[#1c352f] text-sm"
            />
          </div>

          {/* Quick Fill suggestions */}
          <div>
            <div className="text-[11px] text-[#8a928c] mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              快捷测试可用兑换码：
            </div>
            <div className="flex flex-wrap gap-1.5">
              {batches
                .filter((b) => b.type === "universal" && b.status === "已启用")
                .map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleQuickFill(b.code)}
                    className="px-2 py-1 text-xs font-mono bg-white border border-[#d6cfc7] rounded hover:border-[#1c352f] hover:bg-[#1c352f]/5 text-[#1c352f] transition-all"
                  >
                    {b.code} ({b.name.slice(0, 8)}...)
                  </button>
                ))}
              <button
                type="button"
                onClick={() => handleQuickFill("VIP666")}
                className="px-2 py-1 text-xs font-mono bg-white border border-[#d6cfc7] rounded hover:border-[#1c352f] text-[#5a6860]"
              >
                VIP666
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("XUANJI2026")}
                className="px-2 py-1 text-xs font-mono bg-white border border-[#d6cfc7] rounded hover:border-[#1c352f] text-[#5a6860]"
              >
                XUANJI2026
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e2d9] bg-[#f6f3ee]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#d6cfc7] bg-white text-[#5a6860] hover:bg-neutral-50 rounded text-xs font-medium"
          >
            关闭
          </button>

          <button
            type="button"
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 text-white hover:bg-emerald-900 rounded text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? "正在核销..." : "立即核销兑换"}
          </button>
        </div>
      </div>
    </div>
  );
}
