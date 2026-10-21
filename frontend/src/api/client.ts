import type {
  Announcement,
  Event,
  GMBroadcastRequest,
  GMCommandRequest,
  GMItemRequest,
  GMLog,
  GameLog,
  LoginRequest,
  LoginResponse,
  Notice,
  Order,
  OverviewData,
  Player,
  SearchResultItem,
  Settings,
  ShopItem,
  UserSession,
} from "../types";

export * from "../types";

const API_BASE = "/api";
const TOKEN_KEY = "xuanji_auth_token";

let currentToken: string | null = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
let unauthorizedListener: (() => void) | null = null;

export const isSpecificGame = (g?: string): boolean => {
  return !!g && g !== "全部游戏" && g !== "全部区服" && g !== "all";
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) errorMsg = body.error;
    } catch {
      // ignore
    }

    if (response.status === 401 && !endpoint.includes("/auth/login")) {
      api.clearToken();
      if (unauthorizedListener) {
        unauthorizedListener();
      }
    }

    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Authentication
  getToken: () => currentToken,
  setToken: (token: string) => {
    currentToken = token;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken: () => {
    currentToken = null;
    localStorage.removeItem(TOKEN_KEY);
  },
  onUnauthorized: (listener: () => void) => {
    unauthorizedListener = listener;
  },
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    api.setToken(res.token);
    return res;
  },
  getMe: (): Promise<UserSession> => request<UserSession>("/auth/me"),
  logout: async (): Promise<void> => {
    try {
      await request<{ message: string }>("/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    } finally {
      api.clearToken();
    }
  },

  // Health
  checkHealth: () => request<{ status: string; system: string; version: string }>("/health"),

  // Overview
  getOverview: (game: string, range: string) =>
    request<OverviewData>(`/overview?game=${encodeURIComponent(game)}&range=${encodeURIComponent(range)}`),

  // Players
  getPlayers: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (game && game !== "全部区服" && game !== "全部游戏") params.set("game", game);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Player[]>(`/players?${params.toString()}`);
  },
  updatePlayerStatus: (id: string, status: "正常" | "已封禁") =>
    request<Player>(`/players/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updatePlayerTag: (id: string, data: { tags: string[]; remark: string }) =>
    request<Player>(`/players/${id}/tag`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Events (精细化运营与控制)
  getEvents: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (isSpecificGame(game)) params.set("game", game!);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<Event[]>(`/events?${params.toString()}`);
  },
  createEvent: (data: { title: string; game: string; start: string }) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (id: string, data: { title?: string; game?: string; start?: string; end?: string; status?: string }) =>
    request<Event>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateEventStatus: (id: string, status: string) =>
    request<Event>(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  toggleEvent: (id: string) =>
    request<Event>(`/events/${id}/toggle`, {
      method: "POST",
    }),
  resetEventData: (id: string) =>
    request<Event>(`/events/${id}/reset-data`, {
      method: "POST",
    }),
  resetEvent: (id: string) =>
    request<Event>(`/events/${id}/reset`, {
      method: "POST",
    }),
  deleteEvent: (id: string) =>
    request<{ message: string }>(`/events/${id}`, {
      method: "DELETE",
    }),

  // Shop / Mall (商城管理)
  getShopItems: (params?: { game?: string; category?: string; status?: string; query?: string }) => {
    const sp = new URLSearchParams();
    if (isSpecificGame(params?.game)) sp.append("game", params!.game!);
    if (params?.category && params.category !== "全部" && params.category !== "all") sp.append("category", params.category);
    if (params?.status && params.status !== "全部状态" && params.status !== "all") sp.append("status", params.status);
    if (params?.query) sp.append("query", params.query);
    const qs = sp.toString();
    return request<ShopItem[]>(qs ? `/shop/items?${qs}` : "/shop/items");
  },
  getShopItem: (id: string) => request<ShopItem>(`/shop/items/${id}`),
  createShopItem: (item: Partial<ShopItem>) =>
    request<ShopItem>("/shop/items", {
      method: "POST",
      body: JSON.stringify(item),
    }),
  updateShopItem: (id: string, item: Partial<ShopItem>) =>
    request<ShopItem>(`/shop/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  toggleShopItem: (id: string) =>
    request<ShopItem>(`/shop/items/${id}/status`, {
      method: "PATCH",
    }),
  deleteShopItem: (id: string) =>
    request<{ message: string }>(`/shop/items/${id}`, {
      method: "DELETE",
    }),

  // Announcements
  getAnnouncements: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (isSpecificGame(game)) params.set("game", game!);
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

  // Mails (全服/定向邮件补偿系统)
  getMails: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (isSpecificGame(game)) params.set("game", game!);
    if (status && status !== "全部状态") params.set("status", status);
    if (query) params.set("query", query);
    return request<import("../types").Mail[]>(`/mails?${params.toString()}`);
  },
  getMailByID: (id: string) => request<import("../types").Mail>(`/mails/${id}`),
  createMail: (data: import("../types").CreateMailRequest) =>
    request<import("../types").Mail>("/mails", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  recallMail: (id: string) =>
    request<import("../types").Mail>(`/mails/${id}/recall`, {
      method: "PATCH",
    }),
  deleteMail: (id: string) =>
    request<{ message: string }>(`/mails/${id}`, {
      method: "DELETE",
    }),

  // CDKeys (礼包兑换码系统)
  getCDKeyBatches: (params?: { game?: string; type?: string; status?: string; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (isSpecificGame(params?.game)) searchParams.set("game", params!.game!);
    if (params?.type && params.type !== "all") searchParams.set("type", params.type);
    if (params?.status && params.status !== "全部状态") searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    return request<import("../types").CDKeyBatch[]>(`/cdkeys?${searchParams.toString()}`);
  },
  getCDKeyBatchByID: (id: string) => request<import("../types").CDKeyBatch>(`/cdkeys/${id}`),
  createCDKeyBatch: (data: import("../types").CreateCDKeyBatchRequest) =>
    request<import("../types").CDKeyBatch>("/cdkeys", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleCDKeyBatchStatus: (id: string) =>
    request<import("../types").CDKeyBatch>(`/cdkeys/${id}/status`, {
      method: "PATCH",
    }),
  getCDKeyItems: (id: string, params?: { status?: string; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "全部状态") searchParams.set("status", params.status);
    if (params?.query) searchParams.set("query", params.query);
    return request<import("../types").CDKeyItem[]>(`/cdkeys/${id}/items?${searchParams.toString()}`);
  },
  getCDKeyRedemptions: (params?: { game?: string; batchId?: string; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.game && params.game !== "全部游戏") searchParams.set("game", params.game);
    if (params?.batchId && params.batchId !== "all") searchParams.set("batchId", params.batchId);
    if (params?.query) searchParams.set("query", params.query);
    return request<import("../types").CDKeyRedemption[]>(`/cdkeys/redemptions?${searchParams.toString()}`);
  },
  redeemCDKey: (data: import("../types").RedeemCDKeyRequest) =>
    request<import("../types").RedeemCDKeyResponse>("/cdkeys/redeem", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  exportCDKeyItemsCSV: async (id: string, filename?: string) => {
    const url = `/api/cdkeys/${id}/export`;
    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("导出失败");
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename || `cdkeys_${id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },


  // Orders
  getOrders: (game?: string, status?: string, query?: string) => {
    const params = new URLSearchParams();
    if (isSpecificGame(game)) params.set("game", game!);
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

  // GM Tools & Logs
  getGMLogs: () => request<GMLog[]>("/gm/logs"),
  getLogs: () => request<GMLog[]>("/logs"),
  getGameLogs: (params?: { game?: string; category?: string; playerId?: string; level?: string; keyword?: string }) => {
    const sp = new URLSearchParams();
    if (isSpecificGame(params?.game)) sp.append("game", params!.game!);
    if (params?.category && params.category !== "全部") sp.append("category", params.category);
    if (params?.playerId) sp.append("playerId", params.playerId);
    if (params?.level && params.level !== "全部") sp.append("level", params.level);
    if (params?.keyword) sp.append("keyword", params.keyword);
    const qs = sp.toString();
    return request<GameLog[]>(qs ? `/game-logs?${qs}` : "/game-logs");
  },
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

