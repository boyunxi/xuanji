import {
  Activity,
  FileBarChart2,
  LayoutDashboard,
  Megaphone,
  Settings2,
  ShoppingBag,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Game, PageId, RangeKey } from "../types";

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "工作台",
    items: [{ id: "overview", label: "运营总览", icon: LayoutDashboard }],
  },
  {
    label: "运营管理",
    items: [
      { id: "players", label: "玩家管理", icon: UsersRound },
      { id: "events", label: "活动管理", icon: Activity },
      { id: "announcements", label: "公告管理", icon: Megaphone },
      { id: "gm", label: "GM工具", icon: Wrench },
    ],
  },
  {
    label: "数据中心",
    items: [
      { id: "orders", label: "充值订单", icon: ShoppingBag },
      { id: "reports", label: "数据报表", icon: FileBarChart2 },
    ],
  },
  {
    label: "系统",
    items: [{ id: "settings", label: "系统设置", icon: Settings2 }],
  },
];

export const pageInfo: Record<
  PageId,
  { title: string; description: string; group: string }
> = {
  overview: {
    title: "运营总览",
    description: "关键数据与运营动态，尽在掌握。",
    group: "工作台",
  },
  players: {
    title: "玩家管理",
    description: "查看玩家状态，维护良好的游戏环境。",
    group: "运营管理",
  },
  events: {
    title: "活动管理",
    description: "有序安排每一场游戏活动。",
    group: "运营管理",
  },
  announcements: {
    title: "公告管理",
    description: "让重要消息准确触达玩家。",
    group: "运营管理",
  },
  gm: {
    title: "GM工具",
    description: "游戏运维与指令调试，快速干预游戏状态与资源发放。",
    group: "运营管理",
  },
  orders: {
    title: "充值订单",
    description: "追踪交易记录，及时处理异常。",
    group: "数据中心",
  },
  reports: {
    title: "数据报表",
    description: "以清晰数据，辅助每一次决策。",
    group: "数据中心",
  },
  settings: {
    title: "系统设置",
    description: "按需调整工作台提醒与偏好。",
    group: "系统",
  },
};

export const games: Game[] = ["全部游戏", "山海长歌", "九州志", "云间录"];

export const ranges: { id: RangeKey; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "week", label: "近7日" },
  { id: "month", label: "近30日" },
];
