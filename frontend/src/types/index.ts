export type PageId =
  | "overview"
  | "players"
  | "shop"
  | "mails"
  | "cdkeys"
  | "events"
  | "announcements"
  | "gm"
  | "orders"
  | "reports"
  | "logs"
  | "settings";

export type Game = "全部区服" | "全部游戏" | "山海长歌" | "九州志" | "云间录";
export type SpecificGame = "山海长歌" | "九州志" | "云间录";

export type RangeKey = "today" | "week" | "month";

export type Detail =
  | { type: "player" | "event" | "announcement" | "order" | "mail" | "cdkey" | "log" | "shop"; id: string }
  | { type: "profile" };


export interface Player {
  id: string;
  name: string;
  game: SpecificGame | string;
  level: number;
  spend: number;
  lastActive: string;
  status: "正常" | "已封禁";
  tags?: string[]; // 玩家标签，拥有标签的玩家自动置顶排在最上一行
  remark?: string; // 运营专属备注与备忘录
}

export interface Event {
  id: string;
  title: string;
  game: SpecificGame | string;
  start: string;
  end: string;
  participants: number;
  status: "进行中" | "未开始" | "已暂停" | "已结束";
}

export interface ShopItem {
  id: string;
  name: string;
  game: Game | string;
  category: "超值礼包" | "极品法宝" | "灵丹妙药" | "外观时装" | "货币直购" | string;
  currency: "仙玉" | "元宝" | "灵石" | "CNY" | string;
  price: number;
  originalPrice: number;
  stock: number;
  buyLimit: string;
  tag?: string;
  description: string;
  items?: string;
  status: "上架中" | "已下架" | string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export interface GameLog {
  id: string;
  game: string;
  serverId: string;
  playerId: string;
  playerName: string;
  category: "经济流水" | "玩法战斗" | "角色成长" | "道具获取" | "安全风控" | "登录登出" | string;
  action: string;
  detail: string;
  delta?: string;
  ip: string;
  level: "INFO" | "WARN" | "CRITICAL" | string;
  time: string;
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

export interface UserSession {
  username: string;
  name: string;
  role: string;
  avatar: string;
  title: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserSession;
}

export interface MailAttachment {
  itemId: string;
  itemName: string;
  category: string;
  amount: number;
  rarity: "普通" | "稀有" | "史诗" | "传说";
  isBox?: boolean;
}

export interface Mail {
  id: string;
  title: string;
  content: string;
  sender: string;
  game: string;
  targetType: "all" | "player";
  targetId: string;
  minLevel: number;
  status: "已发送" | "草稿" | "已撤回";
  attachments: MailAttachment[];
  sentAt: string;
  expiresAt: string;
  claimedCount: number;
  totalTarget: number;
}

export interface CreateMailRequest {
  title: string;
  content: string;
  sender?: string;
  game: string;
  targetType: "all" | "player";
  targetId?: string;
  minLevel?: number;
  expireDays?: number;
  attachments: MailAttachment[];
  isDraft?: boolean;
}

export type CDKeyType = "universal" | "unique";

export interface CDKeyReward {
  itemId: string;
  itemName: string;
  category: string;
  amount: number;
  rarity?: string;
  isBox?: boolean;
}

export interface CDKeyBatch {
  id: string;
  name: string;
  type: CDKeyType;
  code: string;
  game: string;
  minLevel: number;
  totalCount: number;
  usedCount: number;
  status: "已启用" | "已停用" | "已过期";
  rewards: CDKeyReward[];
  createdAt: string;
  expiresAt: string;
  description: string;
}

export interface CDKeyItem {
  code: string;
  batchId: string;
  status: "待兑换" | "已兑换" | "已作废";
  playerId?: string;
  usedAt?: string;
  expiresAt: string;
}

export interface CDKeyRedemption {
  id: number;
  code: string;
  batchId: string;
  batchName: string;
  playerId: string;
  playerName: string;
  game: string;
  time: string;
  rewards: CDKeyReward[];
}

export interface CreateCDKeyBatchRequest {
  name: string;
  type: CDKeyType;
  code?: string;
  prefix?: string;
  quantity?: number;
  game: string;
  minLevel?: number;
  expireDays?: number;
  rewards: CDKeyReward[];
  description?: string;
}

export interface RedeemCDKeyRequest {
  code: string;
  playerId: string;
  game?: string;
}

export interface RedeemCDKeyResponse {
  success: boolean;
  message: string;
  batchName: string;
  playerId: string;
  rewards: CDKeyReward[];
  time: string;
}



