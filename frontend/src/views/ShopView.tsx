import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Coins,
  Edit3,
  Flame,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/common/StatusBadge";
import type { Game, ShopItem } from "../types";
import { money } from "../utils/format";

interface ShopViewProps {
  onShowToast: (msg: string) => void;
  game?: Game;
}

export function ShopView({ onShowToast, game = "全部游戏" }: ShopViewProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("全部状态");
  const [searchQuery, setSearchQuery] = useState("");

  // 新增 / 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formGame, setFormGame] = useState("全部游戏");
  const [formCategory, setFormCategory] = useState("超值礼包");
  const [formCurrency, setFormCurrency] = useState("仙玉");
  const [formPrice, setFormPrice] = useState<number>(68);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(128);
  const [formStock, setFormStock] = useState<number>(-1);
  const [formBuyLimit, setFormBuyLimit] = useState("不限购");
  const [formTag, setFormTag] = useState("热销");
  const [formItems, setFormItems] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState("上架中");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 删除二次确认
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ShopItem | null>(null);

  // 拉取商城商品
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getShopItems({
        game: game !== "全部游戏" ? game : undefined,
      });
      setItems(data);
    } catch (err: any) {
      onShowToast(`拉取商城商品列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [game]);

  // 筛选商品
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (game !== "全部游戏" && item.game !== game && item.game !== "全部游戏") {
        return false;
      }
      if (activeCategory !== "all" && item.Category !== activeCategory && item.category !== activeCategory) {
        return false;
      }
      if (statusFilter !== "全部状态" && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = item.name.toLowerCase().includes(q);
        const mID = item.id.toLowerCase().includes(q);
        const mDesc = (item.description || "").toLowerCase().includes(q);
        const mItems = (item.items || "").toLowerCase().includes(q);
        const mTag = (item.tag || "").toLowerCase().includes(q);
        if (!mName && !mID && !mDesc && !mItems && !mTag) return false;
      }
      return true;
    });
  }, [items, game, activeCategory, statusFilter, searchQuery]);

  // KPI 统计
  const stats = useMemo(() => {
    const total = items.length;
    const online = items.filter((it) => it.status === "上架中").length;
    const giftCount = items.filter((it) => it.category === "超值礼包").length;
    const offline = items.filter((it) => it.status === "已下架").length;
    return { total, online, giftCount, offline };
  }, [items]);

  // 快捷上下架切换
  const handleToggleStatus = async (item: ShopItem) => {
    try {
      const updated = await api.toggleShopItem(item.id);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      onShowToast(`商品「${updated.name}」已切换为: [${updated.status}]`);
    } catch (err: any) {
      onShowToast(`切换上架状态失败: ${err.message}`);
    }
  };

  // 打开创建弹窗
  const openCreateModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormGame(game !== "全部游戏" ? game : "全部游戏");
    setFormCategory("超值礼包");
    setFormCurrency("仙玉");
    setFormPrice(68);
    setFormOriginalPrice(128);
    setFormStock(-1);
    setFormBuyLimit("不限购");
    setFormTag("新品特惠");
    setFormItems("");
    setFormDesc("");
    setFormStatus("上架中");
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const openEditModal = (item: ShopItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormGame(item.game);
    setFormCategory(item.category);
    setFormCurrency(item.currency);
    setFormPrice(item.price);
    setFormOriginalPrice(item.originalPrice || item.price);
    setFormStock(item.stock ?? -1);
    setFormBuyLimit(item.buyLimit || "不限购");
    setFormTag(item.tag || "");
    setFormItems(item.items || "");
    setFormDesc(item.description || "");
    setFormStatus(item.status);
    setModalOpen(true);
  };

  // 提交新建 / 编辑
  const handleSubmitForm = async () => {
    if (!formName.trim()) {
      onShowToast("商品名称不能为空");
      return;
    }
    if (formPrice <= 0) {
      onShowToast("商品售价必须大于 0");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Partial<ShopItem> = {
        name: formName.trim(),
        game: formGame,
        category: formCategory,
        currency: formCurrency,
        price: Number(formPrice),
        originalPrice: Number(formOriginalPrice || formPrice),
        stock: Number(formStock),
        buyLimit: formBuyLimit,
        tag: formTag.trim(),
        description: formDesc.trim(),
        items: formItems.trim(),
        status: formStatus,
      };

      if (editingItem) {
        const updated = await api.updateShopItem(editingItem.id, payload);
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
        onShowToast(`商品「${updated.name}」参数已更新`);
      } else {
        const created = await api.createShopItem(payload);
        setItems((prev) => [created, ...prev]);
        onShowToast(`新商品「${created.name}」已成功录入商城`);
      }
      setModalOpen(false);
    } catch (err: any) {
      onShowToast(`保存商品失败: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 确认删除商品
  const executeDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      await api.deleteShopItem(deleteConfirmItem.id);
      setItems((prev) => prev.filter((it) => it.id !== deleteConfirmItem.id));
      onShowToast(`商品「${deleteConfirmItem.name}」已从商城彻底移除`);
    } catch (err: any) {
      onShowToast(`删除商品失败: ${err.message}`);
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // 格式化货币符号
  const formatCurrencyLabel = (currency: string, price: number) => {
    if (currency === "CNY") return `¥${price}`;
    return `${price} ${currency}`;
  };

  return (
    <div className="view-container">
      {/* 顶部 KPI 看板 */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">录入商品总数</span>
            <span className="metric-badge primary">
              <Store size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.total}
            <span className="metric-unit">款</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">全服商城货架与礼盒仓库商品总目</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">在售上架中</span>
            <span className="metric-badge positive">
              <ShoppingBag size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.online}
            <span className="metric-unit">款</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">游戏中珍宝阁、集市对玩家开放售卖</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">超值特惠礼包</span>
            <span className="metric-badge accent">
              <Package size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.giftCount}
            <span className="metric-unit">款</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">含首充特惠、月度仙缘与限定礼盒</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">已停售下架</span>
            <span className="metric-badge warning">
              <Tag size={14} />
            </span>
          </div>
          <div className="metric-value">
            {stats.offline}
            <span className="metric-unit">款</span>
          </div>
          <div className="metric-footer">
            <span className="metric-sub">历史活动时效到期或临时封存商品</span>
          </div>
        </div>
      </div>

      {/* 商城主面板 */}
      <div className="table-panel">
        <div className="table-header-custom" style={{ padding: "12px 16px", borderBottom: "1px solid #ede8dc" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* 分类筛选药丸 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { id: "all", label: "全部品类" },
                { id: "超值礼包", label: "超值礼包" },
                { id: "极品法宝", label: "极品法宝" },
                { id: "灵丹妙药", label: "灵丹妙药" },
                { id: "外观时装", label: "外观时装" },
                { id: "货币直购", label: "货币直购" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm ${activeCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: 12, borderRadius: 14 }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 状态筛选、搜索与新建按钮 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-input-wrapper" style={{ width: 220 }}>
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索商品名/道具/角标..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")}>
                    <X size={12} />
                  </button>
                )}
              </div>

              <select
                className="ancient-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: 12, padding: "5px 10px", minWidth: 95 }}
              >
                <option value="全部状态">全部状态</option>
                <option value="上架中">上架中</option>
                <option value="已下架">已下架</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={fetchItems}
                disabled={loading}
                title="刷新商品列表"
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                <Plus size={14} />
                <span>上架新商品</span>
              </button>
            </div>
          </div>
        </div>

        {/* 商品表格 */}
        <div className="table-scroll">
          <table className="ancient-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>商品编号</th>
                <th style={{ minWidth: 180 }}>商品名称 / 卖点角标</th>
                <th style={{ width: 110 }}>所属游戏</th>
                <th style={{ width: 110 }}>商品分类</th>
                <th style={{ width: 140 }}>售价 / 划线原价</th>
                <th style={{ width: 120 }}>限购规则</th>
                <th style={{ width: 90 }}>当前库存</th>
                <th style={{ minWidth: 180 }}>包含道具物品说明</th>
                <th style={{ width: 95 }}>在售状态</th>
                <th style={{ width: 160, textAlign: "center" }}>操作与管控</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "48px 16px", color: "#8a9c92" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Store size={32} style={{ opacity: 0.35 }} />
                      <span>未查询到符合条件的商城商品</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOnline = item.status === "上架中";
                  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

                  return (
                    <tr key={item.id}>
                      <td>
                        <code style={{ fontSize: 11.5, color: "#19362a", fontWeight: 600 }}>{item.id}</code>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ color: "#1a382c", fontSize: 13 }}>{item.name}</strong>
                            {item.tag && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: "#b42b1b",
                                  background: "#fcf0ee",
                                  border: "1px solid #f9cac4",
                                  padding: "0 5px",
                                  borderRadius: 3,
                                }}
                              >
                                {item.tag}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <span style={{ fontSize: 11, color: "#74887d", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: "#254638", fontSize: 12 }}>{item.game}</span>
                      </td>
                      <td>
                        <span className="game-category-tag">{item.category}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#b42b1b", fontSize: 13, fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>
                            {formatCurrencyLabel(item.currency, item.price)}
                          </span>
                          {hasDiscount && (
                            <span style={{ fontSize: 10.5, color: "#8e9f95", textDecoration: "line-through", whiteSpace: "nowrap" }}>
                              {formatCurrencyLabel(item.currency, item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 11.5, color: "#3e574a", background: "#f2eee4", padding: "1px 6px", borderRadius: 3, whiteSpace: "nowrap", display: "inline-block" }}>
                          {item.buyLimit || "不限购"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 11.5, color: item.stock === -1 ? "#4f6e5e" : "#19362a", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {item.stock === -1 ? "无限制" : `${item.stock} 件`}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 11.5,
                            color: "#375043",
                          }}
                          title={item.items}
                        >
                          {item.items || "见详细礼包说明"}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {/* 上下架快捷开关 */}
                          <button
                            type="button"
                            className={`btn btn-sm ${isOnline ? "btn-secondary" : "btn-primary"}`}
                            style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                            onClick={() => handleToggleStatus(item)}
                            title={isOnline ? "点击将商品下架" : "点击将商品重新上架"}
                          >
                            {isOnline ? "下架" : "上架"}
                          </button>

                          {/* 编辑商品 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 8px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}
                            onClick={() => openEditModal(item)}
                            title="修改价格、限购、库存与说明"
                          >
                            <Edit3 size={11} style={{ marginRight: 2 }} />
                            编辑
                          </button>

                          {/* 删除商品 */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 6px", fontSize: 11, color: "#b42b1b", whiteSpace: "nowrap", flexShrink: 0 }}
                            onClick={() => setDeleteConfirmItem(item)}
                            title="删除该商品"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer-custom" style={{ padding: "10px 16px", borderTop: "1px solid #ede8dc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6e8276" }}>
            显示第 1 至 {filteredItems.length} 款商品，共计 {filteredItems.length} 款
          </span>
          <span style={{ fontSize: 11.5, color: "#8a9c92" }}>
            价格与上下架变动实时同步至游戏客户端商城展示
          </span>
        </div>
      </div>

      {/* 弹窗 1: 新建 / 编辑商品 Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Store size={18} style={{ color: "#2b5643" }} />
                <h3 className="modal-title">
                  {editingItem ? "编辑商城在售商品" : "上架全新商城商品"}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "72vh", overflowY: "auto" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  商品名称 <span style={{ color: "#b42b1b" }}>*</span>
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="例如：至尊飞升迎新礼匣"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    所属游戏
                  </label>
                  <select
                    className="ancient-select"
                    style={{ width: "100%", padding: "6px 10px" }}
                    value={formGame}
                    onChange={(e) => setFormGame(e.target.value)}
                  >
                    <option value="全部游戏">全部游戏</option>
                    <option value="山海长歌">山海长歌</option>
                    <option value="九州志">九州志</option>
                    <option value="云间录">云间录</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    商品分类
                  </label>
                  <select
                    className="ancient-select"
                    style={{ width: "100%", padding: "6px 10px" }}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="超值礼包">超值礼包</option>
                    <option value="极品法宝">极品法宝</option>
                    <option value="灵丹妙药">灵丹妙药</option>
                    <option value="外观时装">外观时装</option>
                    <option value="货币直购">货币直购</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    售卖货币
                  </label>
                  <select
                    className="ancient-select"
                    style={{ width: "100%", padding: "6px 10px" }}
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                  >
                    <option value="仙玉">仙玉</option>
                    <option value="元宝">元宝</option>
                    <option value="灵石">灵石</option>
                    <option value="CNY">人民币 (CNY)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    现售价 <span style={{ color: "#b42b1b" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    划线原价
                  </label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    限购规则
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    placeholder="不限购 / 每日限购3次"
                    value={formBuyLimit}
                    onChange={(e) => setFormBuyLimit(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    库存 (-1为不限)
                  </label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ width: "100%" }}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                    角标标签
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: "100%" }}
                    placeholder="例如：热销 / 镇店之宝"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  包含道具内容与礼包组成
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: "100%" }}
                  placeholder="例如：太虚飞剑 x1, 九转还魂金丹 x5, 极品灵石 x10000"
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  商品详细介绍
                </label>
                <textarea
                  className="search-input"
                  style={{ width: "100%", height: 70, resize: "none" }}
                  placeholder="输入商品的详细来历、典故、功用说明..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#254638", display: "block", marginBottom: 4 }}>
                  上架状态
                </label>
                <select
                  className="ancient-select"
                  style={{ width: "100%", padding: "6px 10px" }}
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="上架中">上架中</option>
                  <option value="已下架">已下架</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitForm}
                disabled={isSubmitting}
              >
                {editingItem ? "保存修改" : "确认上架"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 2: 删除确认 */}
      {deleteConfirmItem && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmItem(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={18} style={{ color: "#b42b1b" }} />
                <h3 className="modal-title">确认删除商品</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setDeleteConfirmItem(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: 13, color: "#3a5144", lineHeight: 1.6 }}>
              <p>
                您确定要彻底删除商品 <strong>「{deleteConfirmItem.name}」</strong> (ID: {deleteConfirmItem.id}) 吗？
                <br />
                <span style={{ color: "#b42b1b", fontSize: 12 }}>
                  删除后该商品将从商城永久移除，玩家将无法再查看或购买该商品。
                </span>
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmItem(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: "#b42b1b", color: "#fff", borderColor: "#932316" }}
                onClick={executeDelete}
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
