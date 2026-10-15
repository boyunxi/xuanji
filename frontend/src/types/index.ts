export type PageId =
  | "overview"
  | "players"
  | "events"
  | "announcements"
  | "gm"
  | "orders"
  | "reports"
  | "settings";

export type Game = "全部游戏" | "山海长歌" | "九州志" | "云间录";
export type SpecificGame = Exclude<Game, "全部游戏">;

export type RangeKey = "today" | "week" | "month";

export type Detail =
  | { type: "player" | "event" | "announcement" | "order"; id: string }
  | { type: "profile" };

export interface Player {
  id: string;
  name: string;
  game: SpecificGame;
  level: number;
  spend: number;
  lastActive: string;
  status: "正常" | "已封禁";
}

export interface Event {
  id: string;
  title: string;
  game: SpecificGame;
  start: string;
  end: string;
  participants: number;
  status: "进行中" | "未开始" | "已结束";
}

export interface Announcement {
  id: string;
  title: string;
  game: SpecificGame;
  date: string;
  content: string;
  status: "已发布" | "草稿";
}

export interface Order {
  id: string;
  player: string;
  game: SpecificGame;
  amount: number;
  method: string;
  time: string;
  status: "成功" | "处理中" | "已退款";
}

export interface Notice {
  id: number;
  title: string;
  time: string;
  page: PageId;
  read: boolean;
}

export interface Settings {
  daily: boolean;
  orders: boolean;
  events: boolean;
}

export interface MetricItem {
  label: string;
  value: string;
  unit: string;
  change: string;
  up: boolean;
}

export interface TrendData {
  labels: string[];
  values: number[];
  max: number;
}

export interface RevenuePart {
  name: string;
  percent: number;
  color: string;
  amount: number;
}

export interface TodoItem {
  index: string;
  title: string;
  subtitle: string;
  action: string;
  page: PageId;
}

export interface ActivityItem {
  title: string;
  subtitle: string;
  time: string;
  page: PageId;
}

export interface OverviewData {
  metrics: MetricItem[];
  trend: TrendData;
  revenueParts: RevenuePart[];
  totalRevenue: number;
  todos: TodoItem[];
  activities: ActivityItem[];
}

export interface SearchResultItem {
  title: string;
  subtitle: string;
  page: PageId;
  type: "module" | "player" | "event" | "order";
  id?: string;
  detail?: any;
}

export interface GMLog {
  id: string;
  operator: string;
  action: string;
  target: string;
  detail: string;
  time: string;
  status: "成功" | "失败";
}

export interface GMItemRequest {
  game: string;
  playerId: string;
  itemName: string;
  amount: number;
  reason: string;
}

export interface GMBroadcastRequest {
  game: string;
  content: string;
  priority: string;
}

export interface GMCommandRequest {
  command: string;
  target: string;
  params: string;
}

export interface GameInfo {
  id: string;
  name: string;
  displayOrder: number;
}

export interface GameItem {
  id: string;
  name: string;
  category: string;
  description: string;
  rarity: "普通" | "稀有" | "史诗" | "传说";
  isCustom: boolean;
}

export interface CreateGameItemRequest {
  name: string;
  category: string;
  description: string;
  rarity: "普通" | "稀有" | "史诗" | "传说";
}

export type GiftBoxType = "fixed" | "random_prob" | "single_choice" | "multi_choice";

export interface GiftBoxItem {
  itemName: string;
  category: string;
  amount: number;
  probability: number;
  rarity: "普通" | "稀有" | "史诗" | "传说";
}

export interface GiftBox {
  id: string;
  name: string;
  game: string;
  boxType: GiftBoxType;
  maxChoices: number;
  rarity: "普通" | "稀有" | "史诗" | "传说";
  icon: string;
  description: string;
  status: "已启用" | "已下架";
  items: GiftBoxItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftBoxRequest {
  name: string;
  game: string;
  boxType: GiftBoxType;
  maxChoices: number;
  rarity: "普通" | "稀有" | "史诗" | "传说";
  icon?: string;
  description: string;
  items: GiftBoxItem[];
}

export interface SimulateOpenRequest {
  chosenItems?: string[];
}

export interface SimulateOpenResponse {
  boxId: string;
  boxName: string;
  boxType: GiftBoxType;
  maxChoices: number;
  candidates: GiftBoxItem[];
  wonItems: GiftBoxItem[];
  rolledIndex?: number;
  message: string;
}

export interface DispatchBoxRequest {
  playerId: string;
  amount: number;
  reason: string;
}

