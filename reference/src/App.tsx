import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check, CheckCheck,
  ChevronDown, ChevronRight, Download, FileBarChart2,
  LayoutDashboard, Megaphone, Menu, Plus, Search, Settings2, ShieldCheck,
  ShoppingBag, UsersRound, X, type LucideIcon,
} from "lucide-react";

type PageId = "overview" | "players" | "events" | "announcements" | "orders" | "reports" | "settings";
type Game = "全部游戏" | "山海长歌" | "九州志" | "云间录";
type RangeKey = "today" | "week" | "month";
type Detail = { type: "player" | "event" | "announcement" | "order"; id: string } | { type: "profile" };

type Player = { id: string; name: string; game: Exclude<Game, "全部游戏">; level: number; spend: number; lastActive: string; status: "正常" | "已封禁" };
type Event = { id: string; title: string; game: Exclude<Game, "全部游戏">; start: string; end: string; participants: number; status: "进行中" | "未开始" | "已结束" };
type Announcement = { id: string; title: string; game: Exclude<Game, "全部游戏">; date: string; content: string; status: "已发布" | "草稿" };
type Order = { id: string; player: string; game: Exclude<Game, "全部游戏">; amount: number; method: string; time: string; status: "成功" | "处理中" | "已退款" };
type Notice = { id: number; title: string; time: string; page: PageId; read: boolean };

const navGroups: { label: string; items: { id: PageId; label: string; icon: LucideIcon }[] }[] = [
  { label: "工作台", items: [{ id: "overview", label: "运营总览", icon: LayoutDashboard }] },
  { label: "运营管理", items: [
    { id: "players", label: "玩家管理", icon: UsersRound },
    { id: "events", label: "活动管理", icon: Activity },
    { id: "announcements", label: "公告管理", icon: Megaphone },
  ] },
  { label: "数据中心", items: [
    { id: "orders", label: "充值订单", icon: ShoppingBag },
    { id: "reports", label: "数据报表", icon: FileBarChart2 },
  ] },
  { label: "系统", items: [{ id: "settings", label: "系统设置", icon: Settings2 }] },
];

const pageInfo: Record<PageId, { title: string; description: string; group: string }> = {
  overview: { title: "运营总览", description: "关键数据与运营动态，尽在掌握。", group: "工作台" },
  players: { title: "玩家管理", description: "查看玩家状态，维护良好的游戏环境。", group: "运营管理" },
  events: { title: "活动管理", description: "有序安排每一场游戏活动。", group: "运营管理" },
  announcements: { title: "公告管理", description: "让重要消息准确触达玩家。", group: "运营管理" },
  orders: { title: "充值订单", description: "追踪交易记录，及时处理异常。", group: "数据中心" },
  reports: { title: "数据报表", description: "以清晰数据，辅助每一次决策。", group: "数据中心" },
  settings: { title: "系统设置", description: "按需调整工作台提醒与偏好。", group: "系统" },
};

const games: Game[] = ["全部游戏", "山海长歌", "九州志", "云间录"];
const gameFactors: Record<Game, number> = { 全部游戏: 1, 山海长歌: 0.48, 九州志: 0.32, 云间录: 0.2 };
const ranges: { id: RangeKey; label: string }[] = [
  { id: "today", label: "今日" }, { id: "week", label: "近7日" }, { id: "month", label: "近30日" },
];

function dateFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function orderId(days: number, sequence: string) {
  return `XC${dateFromNow(days).replace(/-/g, "").slice(2)}${sequence}`;
}

function shortDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function trendLabels(range: RangeKey) {
  if (range === "week") return Array.from({ length: 7 }, (_, index) => shortDate(index - 6));
  if (range === "month") return [-29, -24, -19, -14, -9, -4, 0].map(shortDate);
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return Array.from({ length: 7 }, (_, index) => {
    if (index === 6) return "当前";
    const minutes = Math.round((minutesNow * index) / 6);
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  });
}

const initialPlayers: Player[] = [
  { id: "XJ100248", name: "听风入梦", game: "山海长歌", level: 86, spend: 3280, lastActive: "今天 10:42", status: "正常" },
  { id: "XJ100367", name: "青山客", game: "九州志", level: 72, spend: 1680, lastActive: "今天 09:18", status: "正常" },
  { id: "XJ100512", name: "月照归舟", game: "云间录", level: 64, spend: 980, lastActive: "今天 08:56", status: "正常" },
  { id: "XJ100689", name: "拾光者", game: "山海长歌", level: 91, spend: 5680, lastActive: "昨天 22:13", status: "正常" },
  { id: "XJ100731", name: "长安旧梦", game: "九州志", level: 58, spend: 320, lastActive: "昨天 18:35", status: "已封禁" },
  { id: "XJ100845", name: "云深不知处", game: "云间录", level: 77, spend: 2580, lastActive: "昨天 16:09", status: "正常" },
  { id: "XJ100926", name: "一叶知秋", game: "山海长歌", level: 43, spend: 128, lastActive: "2天前", status: "正常" },
];

const initialEvents: Event[] = [
  { id: "EV2401", title: "春山有信", game: "山海长歌", start: dateFromNow(2), end: dateFromNow(9), participants: 0, status: "未开始" },
  { id: "EV2402", title: "九州问剑", game: "九州志", start: dateFromNow(-2), end: dateFromNow(5), participants: 12846, status: "进行中" },
  { id: "EV2403", title: "月下寻宝", game: "云间录", start: dateFromNow(-4), end: dateFromNow(3), participants: 8620, status: "进行中" },
  { id: "EV2404", title: "山海奇遇", game: "山海长歌", start: dateFromNow(-18), end: dateFromNow(-4), participants: 24518, status: "已结束" },
  { id: "EV2405", title: "踏云之约", game: "云间录", start: dateFromNow(7), end: dateFromNow(14), participants: 0, status: "未开始" },
];

const initialAnnouncements: Announcement[] = [
  { id: "AN3101", title: "版本更新说明", game: "山海长歌", date: dateFromNow(0), content: "新版本现已上线，优化了游戏体验并修复部分已知问题。", status: "已发布" },
  { id: "AN3102", title: "服务器维护通知", game: "九州志", date: dateFromNow(-1), content: "服务器将进行例行维护，具体时间请以游戏内通知为准。", status: "已发布" },
  { id: "AN3103", title: "春山有信活动预告", game: "山海长歌", date: dateFromNow(-1), content: "春山有信活动即将开启，参与活动可获得限定奖励。", status: "草稿" },
  { id: "AN3104", title: "月下寻宝开启公告", game: "云间录", date: dateFromNow(-3), content: "月下寻宝活动已开启，欢迎各位玩家参与。", status: "已发布" },
];

const initialOrders: Order[] = [
  { id: orderId(0, "0421"), player: "听风入梦", game: "山海长歌", amount: 328, method: "微信支付", time: `${dateFromNow(0)} 10:42`, status: "成功" },
  { id: orderId(0, "0419"), player: "青山客", game: "九州志", amount: 68, method: "支付宝", time: `${dateFromNow(0)} 10:18`, status: "成功" },
  { id: orderId(0, "0416"), player: "月照归舟", game: "云间录", amount: 198, method: "微信支付", time: `${dateFromNow(0)} 09:56`, status: "处理中" },
  { id: orderId(0, "0408"), player: "拾光者", game: "山海长歌", amount: 648, method: "支付宝", time: `${dateFromNow(0)} 09:24`, status: "成功" },
  { id: orderId(-1, "0398"), player: "一叶知秋", game: "山海长歌", amount: 30, method: "微信支付", time: `${dateFromNow(-1)} 20:31`, status: "已退款" },
  { id: orderId(-1, "0392"), player: "云深不知处", game: "云间录", amount: 128, method: "支付宝", time: `${dateFromNow(-1)} 18:07`, status: "处理中" },
];

const number = (value: number) => Math.round(value).toLocaleString("en-US");
const money = (value: number) => `¥${number(value)}`;

function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function GameSelect({ value, onChange }: { value: Game; onChange: (game: Game) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className="game-select" ref={ref}>
      <button className={`game-select-trigger ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="选择游戏">
        <span className="game-select-caption">游戏</span><span>{value}</span><ChevronDown size={15} strokeWidth={1.8} />
      </button>
      {open && <div className="game-menu">{games.map((item) => <button key={item} className={value === item ? "chosen" : ""} onClick={() => { onChange(item); setOpen(false); }}>{item}{value === item && <Check size={15} strokeWidth={1.9} />}</button>)}</div>}
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: RangeKey; onChange: (range: RangeKey) => void }) {
  return <div className="range-toggle" aria-label="时间范围">{ranges.map((item) => <button key={item.id} className={value === item.id ? "active" : ""} onClick={() => onChange(item.id)} aria-pressed={value === item.id}>{item.label}</button>)}</div>;
}

function MetricStrip({ range, game }: { range: RangeKey; game: Game }) {
  const base = {
    today: { active: 128460, newPlayers: 8642, revenue: 326800, retention: 42.8 },
    week: { active: 115820, newPlayers: 58640, revenue: 2187600, retention: 43.6 },
    month: { active: 108760, newPlayers: 233420, revenue: 8964200, retention: 44.1 },
  }[range];
  const factor = gameFactors[game];
  const metrics = [
    { label: range === "today" ? "活跃玩家" : "日均活跃", value: number(base.active * factor), unit: "人", change: "+12.8%", up: true },
    { label: "新增玩家", value: number(base.newPlayers * factor), unit: "人", change: "+8.2%", up: true },
    { label: "营收总额", value: money(base.revenue * factor), unit: "", change: "+5.6%", up: true },
    { label: range === "today" ? "昨日次留" : "次日留存", value: `${(base.retention + (game === "全部游戏" ? 0 : game === "山海长歌" ? 1.2 : game === "九州志" ? -0.8 : 0.4)).toFixed(1)}%`, unit: "", change: "-1.3%", up: false },
  ];
  return <section className="metrics-strip" aria-label="关键指标">{metrics.map((metric, index) => <div className="metric" key={metric.label} style={{ animationDelay: `${index * 85}ms` }}><div className="metric-label"><span className="metric-mark" />{metric.label}</div><div className="metric-value">{metric.value}<span className="metric-unit">{metric.unit}</span></div><div className="metric-comparison"><span className={metric.up ? "change positive" : "change negative"}>{metric.up ? <ArrowUpRight size={14} strokeWidth={2} /> : <ArrowDownRight size={14} strokeWidth={2} />}{metric.change}</span><span>较上期</span></div></div>)}</section>;
}

function smoothPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function TrendChart({ range, game, large = false }: { range: RangeKey; game: Game; large?: boolean }) {
  const [focused, setFocused] = useState(6);
  const [chartWidth, setChartWidth] = useState(700);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rawValues = {
    today: [22400, 38600, 57400, 76600, 91300, 110700, 128460],
    week: [106800, 111900, 108300, 115600, 117400, 121800, 128460],
    month: [91500, 97500, 100400, 108800, 104300, 118200, 128460],
  }[range];
  const values = rawValues.map((value) => Math.round(value * gameFactors[game]));
  const labels = trendLabels(range);
  const max = Math.ceil(Math.max(...values) / 30000) * 30000;
  const points = values.map((value, index) => ({ x: 52 + index * ((chartWidth - 84) / 6), y: 185 - (value / max) * 159 }));
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} 185 L ${points[0].x} 185 Z`;

  useEffect(() => setFocused(6), [range, game]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setChartWidth(canvas.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={`chart-panel trend-panel ${large ? "large-chart" : ""}`}>
      <div className="panel-heading">
        <div><div className="section-title-line"><span className="title-rule" /><h2>玩家活跃趋势</h2></div><p>{range === "today" ? "今日分时活跃玩家" : "每日活跃玩家变化"}</p></div>
        <div className="chart-current"><span className="current-dot" />{labels[focused]}<strong>{number(values[focused])} <small>人</small></strong></div>
      </div>
      <div className="trend-canvas" ref={canvasRef}>
        <svg key={`${range}-${game}`} viewBox={`0 0 ${chartWidth} 230`} preserveAspectRatio="none" role="img" aria-label="玩家活跃趋势折线图">
          <defs><linearGradient id={`chart-fill-${large ? "large" : "small"}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#467767" stopOpacity="0.19" /><stop offset="100%" stopColor="#467767" stopOpacity="0.005" /></linearGradient></defs>
          {[0, 1, 2, 3].map((tick) => {
            const y = 185 - tick * 53;
            const value = (max / 3) * tick;
            return <g key={tick}><line x1="52" x2={chartWidth - 26} y1={y} y2={y} className="chart-grid-line" /><text x="0" y={y + 4} className="axis-label">{value === 0 ? "0" : `${Math.round(value / 10000)}万`}</text></g>;
          })}
          <path d={area} fill={`url(#chart-fill-${large ? "large" : "small"})`} className="chart-area" />
          <path d={line} className="chart-line" />
          <line x1={points[focused].x} x2={points[focused].x} y1={points[focused].y} y2="185" className="chart-guide" />
          {points.map((point, index) => <g key={index} onMouseEnter={() => setFocused(index)} onFocus={() => setFocused(index)} tabIndex={0} aria-label={`${labels[index]} ${number(values[index])}人`} className="chart-point-group"><circle cx={point.x} cy={point.y} r="16" fill="transparent" />{focused === index && <><circle cx={point.x} cy={point.y} r="9" fill="#3f7565" opacity="0.16" /><circle cx={point.x} cy={point.y} r="4.5" fill="#3f7565" stroke="#ffffff" strokeWidth="2" /></>}</g>)}
          {labels.map((label, index) => <text key={`${label}-${index}`} x={points[index].x} y="219" textAnchor="middle" className="axis-label date-label">{label}</text>)}
        </svg>
      </div>
    </section>
  );
}

function RevenueChart({ revenue }: { revenue: number }) {
  const parts = [
    { name: "游戏充值", percent: 62, color: "#3d7565" },
    { name: "月卡通行证", percent: 26, color: "#bf9a62" },
    { name: "礼包购买", percent: 12, color: "#b96d58" },
  ];
  const circumference = 2 * Math.PI * 72;
  let progress = 0;
  return <section className="chart-panel revenue-panel"><div className="panel-heading"><div><div className="section-title-line"><span className="title-rule" /><h2>营收构成</h2></div><p>按商品类型统计</p></div><span className="panel-note">收入占比</span></div><div className="revenue-content"><div className="donut-wrap"><svg viewBox="0 0 200 200" role="img" aria-label="营收构成环形图"><circle cx="100" cy="100" r="72" fill="none" stroke="#edeae2" strokeWidth="15" />{parts.map((part) => { const offset = progress; progress += part.percent; return <circle key={part.name} cx="100" cy="100" r="72" fill="none" stroke={part.color} strokeWidth="15" strokeDasharray={`${(part.percent / 100) * circumference - 3} ${circumference}`} strokeDashoffset={-(offset / 100) * circumference} className="donut-segment" />; })}</svg><div className="donut-center"><span>营收总额</span><strong>{revenue >= 1000000 ? `¥${(revenue / 10000).toFixed(1)}万` : money(revenue)}</strong></div></div><div className="revenue-legend">{parts.map((part) => <div className="legend-row" key={part.name}><div><i style={{ background: part.color }} /><span>{part.name}</span></div><strong>{part.percent}%</strong></div>)}</div></div><div className="revenue-foot">营收分布稳定，游戏充值为主要来源。</div></section>;
}

function Status({ value }: { value: string }) {
  const tone = ["正常", "进行中", "已发布", "成功"].includes(value) ? "good" : ["未开始", "草稿", "处理中"].includes(value) ? "waiting" : ["已封禁", "已退款"].includes(value) ? "alert" : "quiet";
  return <span className={`status-text ${tone}`}><i />{value}</span>;
}

function TableToolbar({ title, count, query, onQuery, status, onStatus, options }: { title: string; count: number; query: string; onQuery: (value: string) => void; status: string; onStatus: (value: string) => void; options: string[] }) {
  return <div className="table-toolbar"><div className="table-title"><h2>{title}</h2><span>{count} 条记录</span></div><div className="table-filters"><label className="table-search"><Search size={16} strokeWidth={1.8} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索名称或编号" /></label><div className="native-select-wrap"><select value={status} onChange={(event) => onStatus(event.target.value)} aria-label="筛选状态">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></div></div></div>;
}

function TableFooter({ count }: { count: number }) {
  return <div className="table-footer"><span>共 {count} 条记录</span><span>已显示全部</span></div>;
}

function EmptyRow({ span }: { span: number }) { return <tr><td colSpan={span} className="empty-row">暂无符合条件的记录</td></tr>; }

function Drawer({ title, subtitle, onClose, children, action }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; action?: { label: string; onClick: () => void; danger?: boolean } }) {
  return <div className="overlay-layer" role="presentation" onMouseDown={onClose}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="drawer-top"><span>记录详情</span><button className="icon-button" aria-label="关闭详情" onClick={onClose}><X size={19} /></button></div><div className="drawer-heading"><h2>{title}</h2><p>{subtitle}</p></div><div className="drawer-body">{children}</div>{action && <div className="drawer-bottom"><button className={`primary-button ${action.danger ? "danger-button" : ""}`} onClick={action.onClick}>{action.label}<ArrowRight size={16} /></button></div>}</aside></div>;
}

function DetailField({ label, children }: { label: string; children: ReactNode }) { return <div className="detail-field"><span>{label}</span><strong>{children}</strong></div>; }

function SidebarLandscape() {
  return <svg className="sidebar-landscape" viewBox="0 0 250 255" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="187" cy="64" r="30" fill="#d1b47e" opacity=".23" /><path d="M0 145 Q27 139 46 116 Q55 107 64 111 Q89 126 111 95 Q121 80 132 86 Q148 106 172 96 Q187 89 202 105 Q220 117 250 101" fill="none" stroke="#c6c5a8" strokeWidth="1" opacity=".30" /><path d="M0 178 Q31 167 56 139 Q63 132 70 140 L95 163 Q118 142 135 121 Q141 114 149 127 L175 153 Q198 128 221 136 L250 149 L250 255 L0 255Z" fill="#6b8a7b" opacity=".18" /><path d="M0 205 Q40 185 63 187 Q85 191 106 168 Q117 155 128 172 Q148 196 171 175 Q193 154 210 168 L250 194 L250 255 L0 255Z" fill="#91a594" opacity=".17" /><path d="M0 219 Q31 214 55 221 Q82 231 110 215 Q135 200 155 214 Q193 240 250 211 L250 255 L0 255Z" fill="#b3b9a2" opacity=".12" /><path d="M17 173 Q48 165 76 176 M127 142 Q155 138 180 149 M151 194 Q181 185 205 194" fill="none" stroke="#d2c9aa" strokeWidth=".8" opacity=".21" /></svg>;
}

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [game, setGame] = useState<Game>("全部游戏");
  const [range, setRange] = useState<RangeKey>("week");
  const [players, setPlayers] = useState(initialPlayers);
  const [events, setEvents] = useState(initialEvents);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [orders, setOrders] = useState(initialOrders);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [compose, setCompose] = useState<"event" | "announcement" | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formGame, setFormGame] = useState<Exclude<Game, "全部游戏">>("山海长歌");
  const [formDate, setFormDate] = useState(dateFromNow(2));
  const [formContent, setFormContent] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [tableStatus, setTableStatus] = useState("全部状态");
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [reportExported, setReportExported] = useState(false);
  const [settings, setSettings] = useState({ daily: true, orders: true, events: false });
  const [notices, setNotices] = useState<Notice[]>([
    { id: 1, title: "春山有信活动待开启", time: "2小时前", page: "events", read: false },
    { id: 2, title: "有 2 笔订单待核对", time: "3小时前", page: "orders", read: false },
    { id: 3, title: "本周运营数据已更新", time: "今天 08:30", page: "reports", read: false },
  ]);

  const unreadCount = notices.filter((notice) => !notice.read).length;
  const selectedInfo = pageInfo[page];
  const factor = gameFactors[game];
  const baseRevenue = { today: 326800, week: 2187600, month: 8964200 }[range];

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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const matchesGame = (itemGame: Game) => game === "全部游戏" || itemGame === game;
  const matchesQuery = (...values: string[]) => values.some((value) => value.toLowerCase().includes(tableQuery.trim().toLowerCase()));
  const filteredPlayers = players.filter((player) => matchesGame(player.game) && (tableStatus === "全部状态" || player.status === tableStatus) && matchesQuery(player.name, player.id));
  const filteredEvents = events.filter((event) => matchesGame(event.game) && (tableStatus === "全部状态" || event.status === tableStatus) && matchesQuery(event.title, event.id));
  const filteredAnnouncements = announcements.filter((item) => matchesGame(item.game) && (tableStatus === "全部状态" || item.status === tableStatus) && matchesQuery(item.title, item.id));
  const filteredOrders = orders.filter((order) => matchesGame(order.game) && (tableStatus === "全部状态" || order.status === tableStatus) && matchesQuery(order.player, order.id));

  const searchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    const modules = navGroups.flatMap((group) => group.items).filter((item) => !query || item.label.toLowerCase().includes(query)).map((item) => ({ title: item.label, subtitle: pageInfo[item.id].group, page: item.id, icon: item.icon, detail: null as Detail | null }));
    if (!query) return modules;
    const playerResults = players.filter((player) => `${player.name}${player.id}`.toLowerCase().includes(query)).map((player) => ({ title: player.name, subtitle: `玩家 · ${player.id}`, page: "players" as PageId, icon: UsersRound, detail: { type: "player" as const, id: player.id } }));
    const eventResults = events.filter((event) => event.title.toLowerCase().includes(query)).map((event) => ({ title: event.title, subtitle: `活动 · ${event.game}`, page: "events" as PageId, icon: Activity, detail: { type: "event" as const, id: event.id } }));
    return [...modules, ...playerResults, ...eventResults].slice(0, 9);
  }, [globalQuery, players, events]);

  const openCompose = (mode: "event" | "announcement") => {
    setFormTitle("");
    setFormContent("");
    setFormGame(game === "全部游戏" ? "山海长歌" : game);
    setFormDate(dateFromNow(2));
    setCompose(mode);
  };

  const handleCompose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formTitle.trim()) return;
    if (compose === "event") {
      const end = new Date(`${formDate}T12:00:00`);
      end.setDate(end.getDate() + 7);
      const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      setEvents((current) => [{ id: `EV${Date.now().toString().slice(-6)}`, title: formTitle.trim(), game: formGame, start: formDate, end: endDate, participants: 0, status: "未开始" }, ...current]);
      setToast("活动已创建，可在列表中查看");
    } else if (compose === "announcement") {
      setAnnouncements((current) => [{ id: `AN${Date.now().toString().slice(-6)}`, title: formTitle.trim(), game: formGame, date: dateFromNow(0), content: formContent.trim() || "暂无正文", status: "草稿" }, ...current]);
      setToast("公告草稿已保存");
    }
    setCompose(null);
    setTableQuery("");
    setTableStatus("全部状态");
  };

  const exportOrders = () => {
    exportCsv("璇玑-充值订单.csv", ["订单编号", "玩家", "游戏", "金额", "支付方式", "时间", "状态"], filteredOrders.map((order) => [order.id, order.player, order.game, order.amount, order.method, order.time, order.status]));
    setToast("订单记录已导出");
  };

  const exportReport = () => {
    const values = ({ today: [22400, 38600, 57400, 76600, 91300, 110700, 128460], week: [106800, 111900, 108300, 115600, 117400, 121800, 128460], month: [91500, 97500, 100400, 108800, 104300, 118200, 128460] } as const)[range];
    const labels = trendLabels(range);
    exportCsv("璇玑-运营报表.csv", ["日期", "游戏", "活跃玩家"], values.map((value, index) => [labels[index], game, Math.round(value * factor)]));
    setReportExported(true);
    setToast("运营报表已导出");
  };

  const actionButton = (label: string, onClick: () => void, Icon: LucideIcon = Plus) => <button className="primary-button heading-button" onClick={onClick}><Icon size={16} strokeWidth={1.9} />{label}</button>;

  const renderOverview = () => {
    const pendingEvent = events.find((item) => item.status === "未开始");
    const pendingOrders = orders.filter((item) => item.status === "处理中").length;
    return <div className="overview-content content-enter" key={`overview-${range}-${game}`}>
    <MetricStrip range={range} game={game} />
    <div className="charts-grid"><TrendChart range={range} game={game} /><RevenueChart revenue={baseRevenue * factor} /></div>
    <div className="lower-grid">
      <section className="list-panel"><div className="lower-heading"><div className="section-title-line"><span className="title-rule" /><h2>待办事项</h2></div><button className="text-link" onClick={() => navigate("events")}>查看活动 <ArrowRight size={15} /></button></div><div className="todo-list">
        <button onClick={() => { setGame("全部游戏"); navigate("events"); }}><span className="todo-index">01</span><span className="todo-copy"><strong>{pendingEvent ? `「${pendingEvent.title}」活动待开启` : "近期活动已处理"}</strong><small>活动管理 · {pendingEvent ? "请确认上线内容" : "查看活动记录"}</small></span><span className="todo-action">去查看 <ArrowRight size={15} /></span></button>
        <button onClick={() => { setGame("全部游戏"); navigate("orders"); }}><span className="todo-index">02</span><span className="todo-copy"><strong>{pendingOrders ? `${pendingOrders} 笔订单待核对` : "待核对订单已处理"}</strong><small>充值订单 · {pendingOrders ? "核对交易状态" : "查看交易记录"}</small></span><span className="todo-action">去查看 <ArrowRight size={15} /></span></button>
        <button onClick={() => navigate("reports")}><span className="todo-index">03</span><span className="todo-copy"><strong>{reportExported ? "运营报表已导出" : "运营报表待导出"}</strong><small>数据报表 · 汇总关键指标</small></span><span className="todo-action">去查看 <ArrowRight size={15} /></span></button>
      </div></section>
      <section className="list-panel"><div className="lower-heading"><div className="section-title-line"><span className="title-rule" /><h2>近期动态</h2></div><span className="quiet-label">最新记录</span></div><div className="activity-list">
        <button onClick={() => navigate("events")}><span className="activity-line"><i /></span><span><strong>活动配置已更新</strong><small>山海长歌 · 春山有信</small></span><time>10:42</time></button>
        <button onClick={() => navigate("announcements")}><span className="activity-line"><i /></span><span><strong>版本公告已发布</strong><small>山海长歌 · 版本更新说明</small></span><time>09:18</time></button>
        <button onClick={() => navigate("orders")}><span className="activity-line"><i /></span><span><strong>充值订单已完成</strong><small>订单 {orders[0].id}</small></span><time>08:36</time></button>
      </div></section>
    </div>
  </div>;
  };

  const renderPlayers = () => <div className="table-panel content-enter"><TableToolbar title="玩家列表" count={filteredPlayers.length} query={tableQuery} onQuery={setTableQuery} status={tableStatus} onStatus={setTableStatus} options={["全部状态", "正常", "已封禁"]} /><div className="table-scroll"><table className="data-table"><thead><tr><th>玩家 / 编号</th><th>所属游戏</th><th>等级</th><th>累计充值</th><th>最近登录</th><th>账号状态</th><th>操作</th></tr></thead><tbody>
    {filteredPlayers.map((player) => <tr key={player.id} onClick={() => setDetail({ type: "player", id: player.id })}><td><div className="person-cell"><span className="person-avatar">{player.name.slice(0, 1)}</span><span><strong>{player.name}</strong><small>{player.id}</small></span></div></td><td>{player.game}</td><td>Lv.{player.level}</td><td className="numeric-cell">{money(player.spend)}</td><td>{player.lastActive}</td><td><Status value={player.status} /></td><td><button className="row-link">查看 <ArrowRight size={14} /></button></td></tr>)}
    {!filteredPlayers.length && <EmptyRow span={7} />}</tbody></table></div><TableFooter count={filteredPlayers.length} /></div>;

  const renderEvents = () => <div className="table-panel content-enter"><TableToolbar title="活动列表" count={filteredEvents.length} query={tableQuery} onQuery={setTableQuery} status={tableStatus} onStatus={setTableStatus} options={["全部状态", "进行中", "未开始", "已结束"]} /><div className="table-scroll"><table className="data-table"><thead><tr><th>活动名称 / 编号</th><th>所属游戏</th><th>开始时间</th><th>结束时间</th><th>参与玩家</th><th>活动状态</th><th>操作</th></tr></thead><tbody>
    {filteredEvents.map((item) => <tr key={item.id} onClick={() => setDetail({ type: "event", id: item.id })}><td><div className="name-cell"><strong>{item.title}</strong><small>{item.id}</small></div></td><td>{item.game}</td><td>{item.start}</td><td>{item.end}</td><td className="numeric-cell">{number(item.participants)}</td><td><Status value={item.status} /></td><td><button className="row-link">查看 <ArrowRight size={14} /></button></td></tr>)}
    {!filteredEvents.length && <EmptyRow span={7} />}</tbody></table></div><TableFooter count={filteredEvents.length} /></div>;

  const renderAnnouncements = () => <div className="table-panel content-enter"><TableToolbar title="公告列表" count={filteredAnnouncements.length} query={tableQuery} onQuery={setTableQuery} status={tableStatus} onStatus={setTableStatus} options={["全部状态", "已发布", "草稿"]} /><div className="table-scroll"><table className="data-table"><thead><tr><th>公告标题 / 编号</th><th>所属游戏</th><th>创建日期</th><th>内容摘要</th><th>发布状态</th><th>操作</th></tr></thead><tbody>
    {filteredAnnouncements.map((item) => <tr key={item.id} onClick={() => setDetail({ type: "announcement", id: item.id })}><td><div className="name-cell"><strong>{item.title}</strong><small>{item.id}</small></div></td><td>{item.game}</td><td>{item.date}</td><td className="excerpt-cell">{item.content}</td><td><Status value={item.status} /></td><td><button className="row-link">查看 <ArrowRight size={14} /></button></td></tr>)}
    {!filteredAnnouncements.length && <EmptyRow span={6} />}</tbody></table></div><TableFooter count={filteredAnnouncements.length} /></div>;

  const renderOrders = () => <div className="table-panel content-enter"><TableToolbar title="订单列表" count={filteredOrders.length} query={tableQuery} onQuery={setTableQuery} status={tableStatus} onStatus={setTableStatus} options={["全部状态", "成功", "处理中", "已退款"]} /><div className="table-scroll"><table className="data-table"><thead><tr><th>订单编号</th><th>玩家</th><th>所属游戏</th><th>订单金额</th><th>支付方式</th><th>创建时间</th><th>订单状态</th><th>操作</th></tr></thead><tbody>
    {filteredOrders.map((order) => <tr key={order.id} onClick={() => setDetail({ type: "order", id: order.id })}><td className="order-id">{order.id}</td><td>{order.player}</td><td>{order.game}</td><td className="numeric-cell amount-cell">{money(order.amount)}</td><td>{order.method}</td><td>{order.time}</td><td><Status value={order.status} /></td><td><button className="row-link">查看 <ArrowRight size={14} /></button></td></tr>)}
    {!filteredOrders.length && <EmptyRow span={8} />}</tbody></table></div><TableFooter count={filteredOrders.length} /></div>;

  const renderReports = () => {
    const metrics = [
      { label: range === "today" ? "活跃玩家" : "日均活跃", value: number(({ today: 128460, week: 115820, month: 108760 } as const)[range] * factor), note: "较上期 +12.8%" },
      { label: "新增玩家", value: number(({ today: 8642, week: 58640, month: 233420 } as const)[range] * factor), note: "较上期 +8.2%" },
      { label: "营收总额", value: money(baseRevenue * factor), note: "较上期 +5.6%" },
    ];
    return <div className="reports-content content-enter"><div className="report-summary">{metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</div><TrendChart range={range} game={game} large /><div className="report-note"><ShieldCheck size={17} strokeWidth={1.7} /><span>图表与导出文件使用当前所选游戏和时间范围。此页面展示演示数据。</span></div></div>;
  };

  const renderSettings = () => <div className="settings-panel content-enter"><div className="settings-section-head"><div className="section-title-line"><span className="title-rule" /><h2>消息提醒</h2></div><p>选择需要接收的工作台提醒。</p></div>{([
    { id: "daily" as const, title: "每日数据简报", description: "每天早上汇总前一日关键运营数据。" },
    { id: "orders" as const, title: "异常订单提醒", description: "有待核对的充值订单时发送提醒。" },
    { id: "events" as const, title: "活动上线提醒", description: "活动开始前提醒检查配置。" },
  ]).map((item) => <div className="setting-row" key={item.id}><div><strong>{item.title}</strong><p>{item.description}</p></div><button role="switch" aria-checked={settings[item.id]} aria-label={item.title} className={`switch ${settings[item.id] ? "on" : ""}`} onClick={() => setSettings((current) => ({ ...current, [item.id]: !current[item.id] }))}><span /></button></div>)}<div className="settings-bottom"><span>当前偏好仅保存在本次会话。</span><button className="primary-button" onClick={() => setToast("设置已保存至当前会话")}><Check size={16} />保存设置</button></div></div>;

  const renderDetail = () => {
    if (!detail) return null;
    if (detail.type === "profile") return <Drawer title="林管理员" subtitle="璇玑 · 运营管理员" onClose={() => setDetail(null)}><div className="detail-section-label">账号资料</div><div className="detail-fields"><DetailField label="账号角色">运营管理员</DetailField><DetailField label="所属团队">游戏运营组</DetailField><DetailField label="工作台状态"><Status value="正常" /></DetailField></div><p className="drawer-tip">当前为界面演示环境，账号资料不可修改。</p></Drawer>;
    if (detail.type === "player") {
      const player = players.find((item) => item.id === detail.id);
      if (!player) return null;
      return <Drawer title={player.name} subtitle={`玩家编号 ${player.id}`} onClose={() => setDetail(null)} action={{ label: player.status === "正常" ? "封禁账号" : "解除封禁", danger: player.status === "正常", onClick: () => { setPlayers((current) => current.map((item) => item.id === player.id ? { ...item, status: item.status === "正常" ? "已封禁" : "正常" } : item)); setToast(player.status === "正常" ? "账号已封禁" : "账号已解除封禁"); setDetail(null); } }}><div className="detail-section-label">玩家信息</div><div className="detail-fields"><DetailField label="账号状态"><Status value={player.status} /></DetailField><DetailField label="所属游戏">{player.game}</DetailField><DetailField label="当前等级">Lv.{player.level}</DetailField><DetailField label="累计充值">{money(player.spend)}</DetailField><DetailField label="最近登录">{player.lastActive}</DetailField></div><p className="drawer-tip">账号状态调整仅作用于当前演示会话。</p></Drawer>;
    }
    if (detail.type === "event") {
      const item = events.find((event) => event.id === detail.id);
      if (!item) return null;
      return <Drawer title={item.title} subtitle={`活动编号 ${item.id}`} onClose={() => setDetail(null)} action={item.status === "已结束" ? undefined : { label: item.status === "未开始" ? "立即开启" : "结束活动", onClick: () => { const duration = Math.max(1, Math.round((Date.parse(item.end) - Date.parse(item.start)) / 86400000)); setEvents((current) => current.map((event) => event.id === item.id ? { ...event, status: event.status === "未开始" ? "进行中" : "已结束", start: event.status === "未开始" ? dateFromNow(0) : event.start, end: event.status === "未开始" ? dateFromNow(duration) : dateFromNow(0) } : event)); setToast(item.status === "未开始" ? "活动已开启" : "活动已结束"); setDetail(null); } }}><div className="detail-section-label">活动信息</div><div className="detail-fields"><DetailField label="当前状态"><Status value={item.status} /></DetailField><DetailField label="所属游戏">{item.game}</DetailField><DetailField label="开始时间">{item.start}</DetailField><DetailField label="结束时间">{item.end}</DetailField><DetailField label="参与玩家">{number(item.participants)} 人</DetailField></div></Drawer>;
    }
    if (detail.type === "announcement") {
      const item = announcements.find((announcement) => announcement.id === detail.id);
      if (!item) return null;
      return <Drawer title={item.title} subtitle={`公告编号 ${item.id}`} onClose={() => setDetail(null)} action={{ label: item.status === "草稿" ? "发布公告" : "撤回公告", onClick: () => { setAnnouncements((current) => current.map((announcement) => announcement.id === item.id ? { ...announcement, status: announcement.status === "草稿" ? "已发布" : "草稿" } : announcement)); setToast(item.status === "草稿" ? "公告已发布" : "公告已撤回为草稿"); setDetail(null); } }}><div className="detail-section-label">公告信息</div><div className="detail-fields"><DetailField label="发布状态"><Status value={item.status} /></DetailField><DetailField label="所属游戏">{item.game}</DetailField><DetailField label="创建日期">{item.date}</DetailField></div><div className="detail-section-label content-label">公告内容</div><p className="announcement-body">{item.content}</p></Drawer>;
    }
    const order = orders.find((item) => item.id === detail.id);
    if (!order) return null;
    return <Drawer title={money(order.amount)} subtitle={`订单编号 ${order.id}`} onClose={() => setDetail(null)} action={order.status === "处理中" ? { label: "确认支付成功", onClick: () => { setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: "成功" } : item)); setToast("订单状态已更新为成功"); setDetail(null); } } : undefined}><div className="detail-section-label">交易信息</div><div className="detail-fields"><DetailField label="订单状态"><Status value={order.status} /></DetailField><DetailField label="玩家昵称">{order.player}</DetailField><DetailField label="所属游戏">{order.game}</DetailField><DetailField label="支付方式">{order.method}</DetailField><DetailField label="创建时间">{order.time}</DetailField></div></Drawer>;
  };

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-backdrop" aria-label="关闭菜单" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}><div className="sidebar-inner">
      <button className="brand" onClick={() => navigate("overview")} aria-label="璇玑，返回运营总览"><span className="brand-seal">璇</span><span className="brand-word"><strong>璇玑</strong><small>XUANJI OPERATIONS</small></span></button>
      <div className="brand-divider"><span /></div>
      <nav className="side-nav" aria-label="主导航">{navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)} aria-current={page === item.id ? "page" : undefined}><Icon size={18} strokeWidth={1.7} /><span>{item.label}</span>{page === item.id && <span className="nav-active-mark" />}</button>; })}</div>)}</nav>
      <div className="sidebar-bottom"><SidebarLandscape /><div className="sidebar-motto"><span>知微见著</span><i /><span>运筹有度</span></div><div className="sidebar-version">璇玑运营平台 <span>v1.0</span></div></div>
    </div></aside>

    <div className="main-area">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu-button icon-button" aria-label="打开菜单" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="topbar-location">{selectedInfo.group}</span><ChevronRight size={14} className="breadcrumb-chevron" /><strong>{selectedInfo.title}</strong></div>
        <div className="topbar-right"><span className="demo-tag"><i />演示环境</span><button className="top-search" onClick={() => { setGlobalQuery(""); setSearchOpen(true); }}><Search size={17} strokeWidth={1.8} /><span>搜索功能...</span><kbd>Ctrl K</kbd></button><span className="topbar-divider" /><button className="top-icon-button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} aria-label={`通知，${unreadCount}条未读`}><Bell size={19} strokeWidth={1.75} />{unreadCount > 0 && <i className="notification-dot" />}</button><button className="profile-trigger" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-label="打开账号菜单"><span className="profile-avatar">林</span><span className="profile-name">林管理员</span><ChevronDown size={14} strokeWidth={1.8} /></button></div>
        {(notificationsOpen || profileOpen) && <button className="popover-dismiss" aria-label="关闭浮层" onClick={() => { setNotificationsOpen(false); setProfileOpen(false); }} />}
        {notificationsOpen && <div className="top-popover notifications-popover"><div className="popover-head"><strong>消息通知</strong><button onClick={() => setNotices((current) => current.map((notice) => ({ ...notice, read: true })))}><CheckCheck size={15} />全部已读</button></div><div className="notification-list">{notices.map((notice) => <button key={notice.id} onClick={() => { setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item)); navigate(notice.page); }}><span className={`notification-indicator ${notice.read ? "read" : ""}`} /><span><strong>{notice.title}</strong><small>{notice.time}</small></span><ArrowRight size={15} /></button>)}</div></div>}
        {profileOpen && <div className="top-popover profile-popover"><div className="profile-popover-head"><span className="profile-avatar">林</span><span><strong>林管理员</strong><small>运营管理员</small></span></div><button onClick={() => { setDetail({ type: "profile" }); setProfileOpen(false); }}>查看账号资料 <ArrowRight size={15} /></button><span className="profile-popover-foot">璇玑运营平台 · 演示环境</span></div>}
      </header>

      <main className="main-content"><div className="page-heading"><div className="page-heading-copy"><div className="heading-kicker"><span /> 璇玑运营台 <b>/</b> {selectedInfo.group}</div><h1>{selectedInfo.title}</h1><p>{selectedInfo.description}</p></div><div className="heading-controls">{page !== "settings" && <GameSelect value={game} onChange={setGame} />}{(page === "overview" || page === "reports") && <RangeToggle value={range} onChange={setRange} />}{page === "events" && actionButton("新建活动", () => openCompose("event"))}{page === "announcements" && actionButton("新建公告", () => openCompose("announcement"))}{page === "orders" && actionButton("导出订单", exportOrders, Download)}{page === "reports" && actionButton("导出报表", exportReport, Download)}</div></div>
        {page === "overview" && renderOverview()}
        {page === "players" && renderPlayers()}
        {page === "events" && renderEvents()}
        {page === "announcements" && renderAnnouncements()}
        {page === "orders" && renderOrders()}
        {page === "reports" && renderReports()}
        {page === "settings" && renderSettings()}
        <footer className="page-footer"><span>© {new Date().getFullYear()} 璇玑运营平台</span><span>演示数据，仅用于界面预览</span></footer>
      </main>
    </div>

    {searchOpen && <div className="search-overlay" onMouseDown={() => setSearchOpen(false)}><div className="command-dialog" role="dialog" aria-modal="true" aria-label="搜索功能" onMouseDown={(event) => event.stopPropagation()}><div className="command-input"><Search size={20} strokeWidth={1.8} /><input autoFocus value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="搜索功能、玩家或活动..." /><button onClick={() => setSearchOpen(false)} aria-label="关闭搜索"><X size={18} /></button></div><div className="command-results"><div className="command-label">{globalQuery ? "搜索结果" : "快速前往"}</div>{searchResults.length ? searchResults.map((result, index) => { const Icon = result.icon; return <button key={`${result.title}-${index}`} onClick={() => { navigate(result.page); if (result.detail) setDetail(result.detail); }}><span className="command-result-icon"><Icon size={17} strokeWidth={1.8} /></span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ArrowRight size={16} /></button>; }) : <div className="command-empty">没有找到相关内容</div>}</div><div className="command-footer"><span>点击结果打开</span><span>ESC 关闭</span></div></div></div>}

    {compose && <div className="modal-overlay" onMouseDown={() => setCompose(null)}><div className="compose-modal" role="dialog" aria-modal="true" aria-label={compose === "event" ? "新建活动" : "新建公告"} onMouseDown={(event) => event.stopPropagation()}><div className="compose-head"><div><span>运营管理</span><h2>{compose === "event" ? "新建活动" : "新建公告"}</h2></div><button className="icon-button" aria-label="关闭" onClick={() => setCompose(null)}><X size={19} /></button></div><form onSubmit={handleCompose}><label className="form-field"><span>{compose === "event" ? "活动名称" : "公告标题"}</span><input required maxLength={40} value={formTitle} onChange={(event) => setFormTitle(event.target.value)} placeholder={compose === "event" ? "输入活动名称" : "输入公告标题"} /></label><label className="form-field"><span>所属游戏</span><div className="form-select-wrap"><select value={formGame} onChange={(event) => setFormGame(event.target.value as Exclude<Game, "全部游戏">)}>{games.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></div></label>{compose === "event" ? <label className="form-field"><span>开始日期</span><input type="date" min={dateFromNow(0)} required value={formDate} onChange={(event) => setFormDate(event.target.value)} /></label> : <label className="form-field"><span>公告内容</span><textarea rows={4} maxLength={500} required value={formContent} onChange={(event) => setFormContent(event.target.value)} placeholder="简要说明公告内容" /></label>}<div className="compose-actions"><button type="button" className="secondary-button" onClick={() => setCompose(null)}>取消</button><button type="submit" className="primary-button">{compose === "event" ? "创建活动" : "保存草稿"}<ArrowRight size={16} /></button></div></form></div></div>}
    {renderDetail()}
    {toast && <div className="toast" role="status"><Check size={16} strokeWidth={2.2} />{toast}</div>}
  </div>;
}
