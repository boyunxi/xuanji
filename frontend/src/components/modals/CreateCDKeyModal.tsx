import { useState } from "react";
import {
  AlertCircle,
  Gift,
  Plus,
  Ticket,
  Trash2,
  X,
  Package,
  Sparkles,
  Layers,
  Copy,
} from "lucide-react";
import { AncientSelect } from "../common/AncientSelect";
import { AncientNumberInput } from "../common/AncientNumberInput";
import { games } from "../../constants/navigation";
import { predefinedGameItems } from "../../constants/gameItems";
import type {
  CDKeyReward,
  CDKeyType,
  CreateCDKeyBatchRequest,
  Game,
  GameItem,
  GiftBox,
} from "../../types";

interface CreateCDKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCDKeyBatchRequest) => Promise<void>;
  currentGame: Game;
  giftBoxes?: GiftBox[];
  availableItems?: GameItem[];
}

export function CreateCDKeyModal({
  isOpen,
  onClose,
  onSubmit,
  currentGame,
  giftBoxes = [],
  availableItems = predefinedGameItems as any,
}: CreateCDKeyModalProps) {
  const [name, setName] = useState("");
  const [cdkType, setCdkType] = useState<CDKeyType>("universal");
  const [code, setCode] = useState("");
  const [prefix, setPrefix] = useState("XJ-");
  const [quantity, setQuantity] = useState(50);
  const [game, setGame] = useState<string>(currentGame === "全部游戏" ? "全部游戏" : currentGame);
  const [minLevel, setMinLevel] = useState(1);
  const [expireDays, setExpireDays] = useState(30);
  const [description, setDescription] = useState("");
  const [rewards, setRewards] = useState<CDKeyReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New reward selector state
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [selectedRewardType, setSelectedRewardType] = useState<"item" | "box">("item");
  const [selectedItemName, setSelectedItemName] = useState(availableItems[0]?.name || "元宝");
  const [selectedBoxId, setSelectedBoxId] = useState(giftBoxes[0]?.id || "");
  const [rewardAmount, setRewardAmount] = useState(1);

  if (!isOpen) return null;

  const handleAddReward = () => {
    if (selectedRewardType === "item") {
      const item = availableItems.find((i) => i.name === selectedItemName) || availableItems[0];
      if (!item) return;
      setRewards([
        ...rewards,
        {
          itemId: item.id || `ITEM_${Date.now()}`,
          itemName: item.name,
          category: item.category,
          amount: rewardAmount > 0 ? rewardAmount : 1,
          rarity: item.rarity || "普通",
          isBox: false,
        },
      ]);
    } else {
      const box = giftBoxes.find((b) => b.id === selectedBoxId) || giftBoxes[0];
      if (!box) return;
      setRewards([
        ...rewards,
        {
          itemId: box.id,
          itemName: box.name,
          category: "定制礼匣",
          amount: rewardAmount > 0 ? rewardAmount : 1,
          rarity: box.rarity || "传说",
          isBox: true,
        },
      ]);
    }

    setIsAddingReward(false);
    setRewardAmount(1);
  };

  const handleRemoveReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("请输入批次名称");
      return;
    }
    if (cdkType === "universal" && !code.trim()) {
      setError("通用兑换码必须指定代码（例如 VIP666）");
      return;
    }
    if (rewards.length === 0) {
      setError("请至少添加一项绑定的礼包道具或礼盒");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        type: cdkType,
        code: cdkType === "universal" ? code.trim().toUpperCase() : undefined,
        prefix: cdkType === "unique" ? prefix.trim().toUpperCase() : undefined,
        quantity: cdkType === "unique" ? quantity : undefined,
        game,
        minLevel,
        expireDays,
        rewards,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "创建兑换码批次失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#fcfbf7] border border-[#d6cfc7] rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2d9] bg-[#f6f3ee]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1c352f]/10 flex items-center justify-center text-[#1c352f]">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#1c352f]">新建 CDKey 礼包兑换码批次</h2>
              <p className="text-xs text-[#8a928c]">
                支持通用福利码（一码多兑）与批量独占卡密生成（一码一兑）
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-[#2d4038]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-medium text-[#5a6860] mb-2">兑换码类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCdkType("universal")}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  cdkType === "universal"
                    ? "border-[#1c352f] bg-[#1c352f]/5 text-[#1c352f] shadow-sm font-medium"
                    : "border-[#e0dcd3] bg-white text-[#5a6860] hover:border-[#b8b0a2]"
                }`}
              >
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="text-sm font-semibold">通用福利码 (一码多兑)</div>
                  <div className="text-xs opacity-75 mt-0.5">
                    适用于全员或渠道通码（如 VIP666），每个玩家账号仅限兑换1次
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCdkType("unique")}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  cdkType === "unique"
                    ? "border-[#1c352f] bg-[#1c352f]/5 text-[#1c352f] shadow-sm font-medium"
                    : "border-[#e0dcd3] bg-white text-[#5a6860] hover:border-[#b8b0a2]"
                }`}
              >
                <Layers className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
                <div>
                  <div className="text-sm font-semibold">批量独占卡密 (一码一兑)</div>
                  <div className="text-xs opacity-75 mt-0.5">
                    批量生成专属激活码（如 TapTap 活动发卡），使用一次即被核销作废
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5a6860] mb-1">
                批次名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：2026新春限定狂欢礼"
                className="w-full px-3 py-2 bg-white border border-[#d6cfc7] rounded-md focus:outline-none focus:border-[#1c352f] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5a6860] mb-1">生效游戏</label>
              <AncientSelect
                value={game}
                onChange={(val) => setGame(val)}
                options={games.map((g) => ({ label: g, value: g }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Conditional Input based on Type */}
          {cdkType === "universal" ? (
            <div className="p-3.5 bg-[#f5f2eb] border border-[#e2dcd2] rounded-lg space-y-2">
              <label className="block text-xs font-semibold text-[#1c352f]">
                通用兑换码字串 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="例如：VIP888 或 XUANJI2026"
                  className="flex-1 font-mono uppercase px-3 py-2 bg-white border border-[#d6cfc7] rounded-md focus:outline-none focus:border-[#1c352f] text-sm tracking-widest font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setCode(`VIP${Math.floor(100 + Math.random() * 900)}`)}
                  className="px-3 py-2 text-xs border border-[#d6cfc7] bg-white rounded-md hover:bg-neutral-50 text-[#5a6860]"
                >
                  随机生成
                </button>
              </div>
              <p className="text-[11px] text-[#78847d]">
                玩家在游戏内或后台输入此代码即可核销，系统自动防刷单人仅限兑换一次。
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-[#f5f2eb] border border-[#e2dcd2] rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1c352f] mb-1">
                    卡密前缀 (Prefix)
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="例如：XJ- 或 TAP-"
                    className="w-full font-mono uppercase px-3 py-2 bg-white border border-[#d6cfc7] rounded-md focus:outline-none focus:border-[#1c352f] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1c352f] mb-1">
                    生成数量 (1 ~ 5000)
                  </label>
                  <AncientNumberInput
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={5000}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#78847d]">
                将为您生成 {quantity} 张格式为{" "}
                <span className="font-mono font-medium text-[#1c352f]">
                  {prefix || "XJ-"}XXXX-XXXX
                </span>{" "}
                的高安全独占卡密，支持一键导出 CSV 交付渠道发卡。
              </p>
            </div>
          )}

          {/* Level & Expiry constraints */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5a6860] mb-1">
                最低角色等级门槛 (Lv)
              </label>
              <AncientNumberInput
                value={minLevel}
                onChange={setMinLevel}
                min={1}
                max={200}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5a6860] mb-1">有效天数 (天)</label>
              <AncientNumberInput
                value={expireDays}
                onChange={setExpireDays}
                min={1}
                max={365}
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#5a6860] mb-1">批次备注 / 描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：TapTap首发预约渠道独享礼包，含绝世飞剑"
              className="w-full px-3 py-2 bg-white border border-[#d6cfc7] rounded-md focus:outline-none focus:border-[#1c352f] text-sm"
            />
          </div>

          {/* Rewards List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#1c352f] flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                绑定礼包奖励物品 ({rewards.length})
              </label>

              {!isAddingReward && (
                <button
                  type="button"
                  onClick={() => setIsAddingReward(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#1c352f] hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加奖励物品/礼盒
                </button>
              )}
            </div>

            {/* Added Rewards Table/Pills */}
            {rewards.length === 0 ? (
              <div className="p-4 border border-dashed border-[#d6cfc7] rounded-lg text-center text-xs text-[#8a928c] bg-white">
                暂未配置奖励，请点击上方“添加奖励物品/礼盒”为兑换码绑定物资
              </div>
            ) : (
              <div className="space-y-2">
                {rewards.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#e2dcd2] rounded-md text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.isBox
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {r.isBox ? "定制礼匣" : r.category}
                      </span>
                      <span className="font-semibold text-[#1c352f]">{r.itemName}</span>
                      <span className="text-[#8a928c]">x {r.amount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReward(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reward Picker Inline Form */}
            {isAddingReward && (
              <div className="mt-3 p-3 bg-[#f3efe8] border border-[#dcd6cc] rounded-lg space-y-3 animate-fade-in">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRewardType("item")}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedRewardType === "item"
                        ? "bg-[#1c352f] text-white"
                        : "bg-white text-[#5a6860] border border-[#d6cfc7]"
                    }`}
                  >
                    游戏道具库
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRewardType("box")}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedRewardType === "box"
                        ? "bg-[#1c352f] text-white"
                        : "bg-white text-[#5a6860] border border-[#d6cfc7]"
                    }`}
                  >
                    定制礼盒箱 ({giftBoxes.length})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedRewardType === "item" ? (
                    <div>
                      <label className="block text-[11px] text-[#5a6860] mb-1">选择道具</label>
                      <AncientSelect
                        value={selectedItemName}
                        onChange={(val) => setSelectedItemName(val)}
                        options={availableItems.map((i) => ({
                          label: `${i.name} (${i.category})`,
                          value: i.name,
                        }))}
                        className="w-full text-xs"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] text-[#5a6860] mb-1">选择礼盒</label>
                      <AncientSelect
                        value={selectedBoxId}
                        onChange={(val) => setSelectedBoxId(val)}
                        options={giftBoxes.map((b) => ({
                          label: `${b.name} (${b.rarity})`,
                          value: b.id,
                        }))}
                        className="w-full text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-[#5a6860] mb-1">发放数量</label>
                    <AncientNumberInput
                      value={rewardAmount}
                      onChange={setRewardAmount}
                      min={1}
                      max={999999}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingReward(false)}
                    className="px-2.5 py-1 text-xs text-[#5a6860] hover:text-[#1c352f]"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAddReward}
                    className="px-3 py-1 bg-[#1c352f] text-white text-xs rounded hover:bg-[#284941]"
                  >
                    确认添加
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e2d9] bg-[#f6f3ee]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#d6cfc7] bg-white text-[#5a6860] hover:bg-neutral-50 rounded text-xs font-medium"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1c352f] text-white hover:bg-[#284941] rounded text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <Ticket className="w-3.5 h-3.5" />
            {loading ? "正在生成..." : "确认创建并启用"}
          </button>
        </div>
      </div>
    </div>
  );
}
