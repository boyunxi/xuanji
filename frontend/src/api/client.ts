// API client for Xuanji Ancient-Style Game Operations Backend (Go)
import type {
  Announcement,
  Event,
  GMBroadcastRequest,
  GMCommandRequest,
  GMItemRequest,
  GMLog,
  Notice,
  Order,
  OverviewData,
  Player,
  SearchResultItem,
  Settings,
} from "../types";

export * from "../types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) errorMsg = body.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; system: string; version: string }>("/health"),

  // Overview
  getOverview: (game: string, range: string) =>
    request<OverviewData>(`/overview?game=${encodeURIComponent(game)}&range=${encodeURIComponent(range)}`),

  // Players
  getPlayers: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (game && game !== "全部游戏") params.set("game", game);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Player[]>(`/players?${params.toString()}`);
  },
  updatePlayerStatus: (id: string, status: "正常" | "已封禁") =>
    request<Player>(`/players/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Events
  getEvents: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (game && game !== "全部游戏") params.set("game", game);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Event[]>(`/events?${params.toString()}`);
  },
  createEvent: (data: { title: string; game: string; start: string }) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEventStatus: (id: string, status: "进行中" | "未开始" | "已结束") =>
    request<Event>(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Announcements
  getAnnouncements: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (game && game !== "全部游戏") params.set("game", game);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Announcement[]>(`/announcements?${params.toString()}`);
  },
  createAnnouncement: (data: { title: string; game: string; content: string }) =>
    request<Announcement>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAnnouncementStatus: (id: string, status: "已发布" | "草稿") =>
    request<Announcement>(`/announcements/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteAnnouncement: (id: string) =>
    request<{ message: string }>(`/announcements/${id}`, {
      method: "DELETE",
    }),

  // Orders
  getOrders: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (game && game !== "全部游戏") params.set("game", game);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Order[]>(`/orders?${params.toString()}`);
  },
  updateOrderStatus: (id: string, status: "成功" | "处理中" | "已退款") =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Reports
  getReports: (game: string, range: string) =>
    request<{ metrics: any[]; trend: any; game: string; range: string }>(
      `/reports?game=${encodeURIComponent(game)}&range=${encodeURIComponent(range)}`
    ),

  // Notices
  getNotices: () => request<Notice[]>("/notices"),
  markNoticeRead: (id: number) =>
    request<{ success: boolean }>(`/notices/${id}/read`, { method: "PATCH" }),
  markAllNoticesRead: () =>
    request<{ success: boolean }>("/notices/read-all", { method: "PATCH" }),

  // Settings
  getSettings: () => request<Settings>("/settings"),
  updateSettings: (settings: Settings) =>
    request<Settings>("/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    }),

  // GM Tools
  getGMLogs: () => request<GMLog[]>("/gm/logs"),
  sendGMItem: (data: GMItemRequest) =>
    request<GMLog>("/gm/item", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendGMBroadcast: (data: GMBroadcastRequest) =>
    request<GMLog>("/gm/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  executeGMCommand: (data: GMCommandRequest) =>
    request<GMLog>("/gm/command", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Games
  getGames: () => request<{ id: string; name: string; displayOrder: number }[]>("/games"),

  // Items
  getItems: (category?: string, query?: string) => {
    const params = new URLSearchParams();
    if (category && category !== "全部") params.set("category", category);
    if (query) params.set("query", query);
    return request<import("../types").GameItem[]>(`/items?${params.toString()}`);
  },
  createItem: (data: import("../types").CreateGameItemRequest) =>
    request<import("../types").GameItem>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // GM Custom Gift Boxes (定制礼匣系统)
  getGiftBoxes: (params?: { game?: string; boxType?: string; status?: string; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.game && params.game !== "全部游戏") searchParams.set("game", params.game);
    if (params?.boxType && params.boxType !== "全部类型") searchParams.set("boxType", params.boxType);
    if (params?.status && params.status !== "全部状态") searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    return request<import("../types").GiftBox[]>(`/gm/boxes?${searchParams.toString()}`);
  },
  getGiftBox: (id: string) => request<import("../types").GiftBox>(`/gm/boxes/${id}`),
  createGiftBox: (data: import("../types").CreateGiftBoxRequest) =>
    request<import("../types").GiftBox>("/gm/boxes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateGiftBox: (id: string, data: import("../types").CreateGiftBoxRequest) =>
    request<import("../types").GiftBox>(`/gm/boxes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteGiftBox: (id: string) =>
    request<{ message: string }>(`/gm/boxes/${id}`, {
      method: "DELETE",
    }),
  toggleGiftBoxStatus: (id: string) =>
    request<import("../types").GiftBox>(`/gm/boxes/${id}/status`, {
      method: "PATCH",
    }),
  simulateOpenBox: (id: string, data?: import("../types").SimulateOpenRequest) =>
    request<import("../types").SimulateOpenResponse>(`/gm/boxes/${id}/simulate-open`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  dispatchGiftBox: (id: string, data: import("../types").DispatchBoxRequest) =>
    request<GMLog>(`/gm/boxes/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Global Search
  search: (q: string) => request<SearchResultItem[]>(`/search?q=${encodeURIComponent(q)}`),
};

