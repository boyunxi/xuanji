package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"xuanji-backend/internal/model"
	"xuanji-backend/internal/store"
)

type APIHandler struct {
	store *store.DataStore
}

func NewAPIHandler(s *store.DataStore) *APIHandler {
	return &APIHandler{store: s}
}

// JSON helpers
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// RegisterRoutes registers all API endpoints onto the provided ServeMux
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	// Health check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"status":  "ok",
			"system":  "璇玑游戏运营平台",
			"version": "1.0.0",
		})
	})

	// Overview
	mux.HandleFunc("GET /api/overview", h.handleGetOverview)

	// Players
	mux.HandleFunc("GET /api/players", h.handleGetPlayers)
	mux.HandleFunc("GET /api/players/{id}", h.handleGetPlayerByID)
	mux.HandleFunc("PATCH /api/players/{id}/status", h.handleUpdatePlayerStatus)

	// Events
	mux.HandleFunc("GET /api/events", h.handleGetEvents)
	mux.HandleFunc("GET /api/events/{id}", h.handleGetEventByID)
	mux.HandleFunc("POST /api/events", h.handleCreateEvent)
	mux.HandleFunc("PATCH /api/events/{id}/status", h.handleUpdateEventStatus)

	// Announcements
	mux.HandleFunc("GET /api/announcements", h.handleGetAnnouncements)
	mux.HandleFunc("GET /api/announcements/{id}", h.handleGetAnnouncementByID)
	mux.HandleFunc("POST /api/announcements", h.handleCreateAnnouncement)
	mux.HandleFunc("PATCH /api/announcements/{id}/status", h.handleUpdateAnnouncementStatus)
	mux.HandleFunc("DELETE /api/announcements/{id}", h.handleDeleteAnnouncement)

	// Orders
	mux.HandleFunc("GET /api/orders", h.handleGetOrders)
	mux.HandleFunc("GET /api/orders/{id}", h.handleGetOrderByByID)
	mux.HandleFunc("PATCH /api/orders/{id}/status", h.handleUpdateOrderStatus)
	mux.HandleFunc("GET /api/orders/export", h.handleExportOrders)

	// Reports
	mux.HandleFunc("GET /api/reports", h.handleGetReports)
	mux.HandleFunc("GET /api/reports/export", h.handleExportReports)

	// Notices
	mux.HandleFunc("GET /api/notices", h.handleGetNotices)
	mux.HandleFunc("PATCH /api/notices/{id}/read", h.handleMarkNoticeRead)
	mux.HandleFunc("PATCH /api/notices/read-all", h.handleMarkAllNoticesRead)

	// Settings
	mux.HandleFunc("GET /api/settings", h.handleGetSettings)
	mux.HandleFunc("POST /api/settings", h.handleUpdateSettings)

	// Games
	mux.HandleFunc("GET /api/games", h.handleGetGames)

	// Items (Game item catalog)
	mux.HandleFunc("GET /api/items", h.handleGetItems)
	mux.HandleFunc("POST /api/items", h.handleCreateItem)

	// GM Tools
	mux.HandleFunc("GET /api/gm/logs", h.handleGetGMLogs)
	mux.HandleFunc("POST /api/gm/item", h.handleSendGMItem)
	mux.HandleFunc("POST /api/gm/broadcast", h.handleSendGMBroadcast)
	mux.HandleFunc("POST /api/gm/command", h.handleExecuteGMCommand)

	// GM Custom Gift Boxes (定制礼包系统)
	mux.HandleFunc("GET /api/gm/boxes", h.handleGetGiftBoxes)
	mux.HandleFunc("GET /api/gm/boxes/{id}", h.handleGetGiftBoxByID)
	mux.HandleFunc("POST /api/gm/boxes", h.handleCreateGiftBox)
	mux.HandleFunc("PUT /api/gm/boxes/{id}", h.handleUpdateGiftBox)
	mux.HandleFunc("DELETE /api/gm/boxes/{id}", h.handleDeleteGiftBox)
	mux.HandleFunc("PATCH /api/gm/boxes/{id}/status", h.handleToggleGiftBoxStatus)
	mux.HandleFunc("POST /api/gm/boxes/{id}/simulate-open", h.handleSimulateOpenBox)
	mux.HandleFunc("POST /api/gm/boxes/{id}/dispatch", h.handleDispatchGiftBox)

	// Global Search
	mux.HandleFunc("GET /api/search", h.handleGlobalSearch)
}

// Overview
func (h *APIHandler) handleGetOverview(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	rangeKey := r.URL.Query().Get("range")
	overview := h.store.GetOverview(game, rangeKey)
	writeJSON(w, http.StatusOK, overview)
}

// Players
func (h *APIHandler) handleGetPlayers(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	status := r.URL.Query().Get("status")
	query := r.URL.Query().Get("query")
	players := h.store.GetPlayers(game, status, query)
	writeJSON(w, http.StatusOK, players)
}

func (h *APIHandler) handleGetPlayerByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, found := h.store.GetPlayer(id)
	if !found {
		writeError(w, http.StatusNotFound, "玩家不存在")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *APIHandler) handleUpdatePlayerStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效请求体")
		return
	}
	p, err := h.store.UpdatePlayerStatus(id, req.Status)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, p)
}

// Events
func (h *APIHandler) handleGetEvents(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	status := r.URL.Query().Get("status")
	query := r.URL.Query().Get("query")
	events := h.store.GetEvents(game, status, query)
	writeJSON(w, http.StatusOK, events)
}

func (h *APIHandler) handleGetEventByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	e, found := h.store.GetEvent(id)
	if !found {
		writeError(w, http.StatusNotFound, "活动不存在")
		return
	}
	writeJSON(w, http.StatusOK, e)
}

func (h *APIHandler) handleCreateEvent(w http.ResponseWriter, r *http.Request) {
	var req model.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "活动名称不能为空")
		return
	}
	event, err := h.store.CreateEvent(req.Title, req.Game, req.Start)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (h *APIHandler) handleUpdateEventStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效请求体")
		return
	}
	event, err := h.store.UpdateEventStatus(id, req.Status)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, event)
}

// Announcements
func (h *APIHandler) handleGetAnnouncements(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	status := r.URL.Query().Get("status")
	query := r.URL.Query().Get("query")
	announcements := h.store.GetAnnouncements(game, status, query)
	writeJSON(w, http.StatusOK, announcements)
}

func (h *APIHandler) handleGetAnnouncementByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	a, found := h.store.GetAnnouncement(id)
	if !found {
		writeError(w, http.StatusNotFound, "公告不存在")
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *APIHandler) handleCreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	var req model.CreateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "公告标题不能为空")
		return
	}
	ann, err := h.store.CreateAnnouncement(req.Title, req.Game, req.Content)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, ann)
}

func (h *APIHandler) handleUpdateAnnouncementStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效请求体")
		return
	}
	ann, err := h.store.UpdateAnnouncementStatus(id, req.Status)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, ann)
}

func (h *APIHandler) handleDeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.store.DeleteAnnouncement(id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "已删除"})
}

// Orders
func (h *APIHandler) handleGetOrders(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	status := r.URL.Query().Get("status")
	query := r.URL.Query().Get("query")
	orders := h.store.GetOrders(game, status, query)
	writeJSON(w, http.StatusOK, orders)
}

func (h *APIHandler) handleGetOrderByByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	o, found := h.store.GetOrder(id)
	if !found {
		writeError(w, http.StatusNotFound, "订单不存在")
		return
	}
	writeJSON(w, http.StatusOK, o)
}

func (h *APIHandler) handleUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效请求体")
		return
	}
	order, err := h.store.UpdateOrderStatus(id, req.Status)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, order)
}

func (h *APIHandler) handleExportOrders(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	status := r.URL.Query().Get("status")
	query := r.URL.Query().Get("query")
	orders := h.store.GetOrders(game, status, query)

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"xuanji-orders.csv\"")
	// Write UTF-8 BOM
	_, _ = w.Write([]byte("\xEF\xBB\xBF"))

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"订单编号", "玩家", "所属游戏", "订单金额", "支付方式", "创建时间", "订单状态"})
	for _, o := range orders {
		_ = writer.Write([]string{
			o.ID,
			o.Player,
			o.Game,
			fmt.Sprintf("%.2f", o.Amount),
			o.Method,
			o.Time,
			o.Status,
		})
	}
	writer.Flush()
}

// Reports
func (h *APIHandler) handleGetReports(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	rangeKey := r.URL.Query().Get("range")
	overview := h.store.GetOverview(game, rangeKey)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"metrics": overview.Metrics,
		"trend":   overview.Trend,
		"game":    game,
		"range":   rangeKey,
	})
}

func (h *APIHandler) handleExportReports(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	rangeKey := r.URL.Query().Get("range")
	overview := h.store.GetOverview(game, rangeKey)

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"xuanji-reports.csv\"")
	_, _ = w.Write([]byte("\xEF\xBB\xBF"))

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"日期/时间", "所属游戏", "活跃玩家数"})
	for i, label := range overview.Trend.Labels {
		val := 0.0
		if i < len(overview.Trend.Values) {
			val = overview.Trend.Values[i]
		}
		_ = writer.Write([]string{label, game, fmt.Sprintf("%.0f", val)})
	}
	writer.Flush()
}

// Notices
func (h *APIHandler) handleGetNotices(w http.ResponseWriter, r *http.Request) {
	notices := h.store.GetNotices()
	writeJSON(w, http.StatusOK, notices)
}

func (h *APIHandler) handleMarkNoticeRead(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "无效的通知ID")
		return
	}
	if !h.store.MarkNoticeRead(id) {
		writeError(w, http.StatusNotFound, "通知未找到")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *APIHandler) handleMarkAllNoticesRead(w http.ResponseWriter, r *http.Request) {
	h.store.MarkAllNoticesRead()
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// Settings
func (h *APIHandler) handleGetSettings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.store.GetSettings())
}

func (h *APIHandler) handleUpdateSettings(w http.ResponseWriter, r *http.Request) {
	var st model.Settings
	if err := json.NewDecoder(r.Body).Decode(&st); err != nil {
		writeError(w, http.StatusBadRequest, "无效设置数据")
		return
	}
	updated, err := h.store.UpdateSettings(st)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// Search
func (h *APIHandler) handleGlobalSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	results := h.store.Search(query)
	writeJSON(w, http.StatusOK, results)
}

// GM Tools
func (h *APIHandler) handleGetGMLogs(w http.ResponseWriter, r *http.Request) {
	logs := h.store.GetGMLogs()
	writeJSON(w, http.StatusOK, logs)
}

func (h *APIHandler) handleSendGMItem(w http.ResponseWriter, r *http.Request) {
	var req model.GMItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.PlayerID) == "" || strings.TrimSpace(req.ItemName) == "" {
		writeError(w, http.StatusBadRequest, "玩家ID和物品名称不能为空")
		return
	}
	if req.Amount <= 0 {
		req.Amount = 1
	}
	logEntry, err := h.store.SendGMItem(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, logEntry)
}

func (h *APIHandler) handleSendGMBroadcast(w http.ResponseWriter, r *http.Request) {
	var req model.GMBroadcastRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Content) == "" {
		writeError(w, http.StatusBadRequest, "广播正文内容不能为空")
		return
	}
	logEntry, err := h.store.SendGMBroadcast(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, logEntry)
}

func (h *APIHandler) handleExecuteGMCommand(w http.ResponseWriter, r *http.Request) {
	var req model.GMCommandRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Command) == "" {
		writeError(w, http.StatusBadRequest, "GM指令不能为空")
		return
	}
	logEntry, err := h.store.ExecuteGMCommand(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, logEntry)
}

// Games
func (h *APIHandler) handleGetGames(w http.ResponseWriter, r *http.Request) {
	games := h.store.GetGames()
	writeJSON(w, http.StatusOK, games)
}

// Items
func (h *APIHandler) handleGetItems(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	q := r.URL.Query().Get("q")
	items := h.store.GetItems(category, q)
	writeJSON(w, http.StatusOK, items)
}

func (h *APIHandler) handleCreateItem(w http.ResponseWriter, r *http.Request) {
	var req model.CreateGameItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效的道具数据")
		return
	}
	item, err := h.store.CreateItem(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

// Gift Boxes
func (h *APIHandler) handleGetGiftBoxes(w http.ResponseWriter, r *http.Request) {
	game := r.URL.Query().Get("game")
	boxType := r.URL.Query().Get("boxType")
	status := r.URL.Query().Get("status")
	q := r.URL.Query().Get("q")
	boxes := h.store.GetGiftBoxes(game, boxType, status, q)
	writeJSON(w, http.StatusOK, boxes)
}

func (h *APIHandler) handleGetGiftBoxByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	box, err := h.store.GetGiftBox(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, box)
}

func (h *APIHandler) handleCreateGiftBox(w http.ResponseWriter, r *http.Request) {
	var req model.CreateGiftBoxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效的礼盒数据")
		return
	}
	box, err := h.store.CreateGiftBox(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, box)
}

func (h *APIHandler) handleUpdateGiftBox(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.CreateGiftBoxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效的礼盒数据")
		return
	}
	box, err := h.store.UpdateGiftBox(id, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, box)
}

func (h *APIHandler) handleDeleteGiftBox(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.store.DeleteGiftBox(id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "礼盒已成功删除"})
}

func (h *APIHandler) handleToggleGiftBoxStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	box, err := h.store.ToggleGiftBoxStatus(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, box)
}

func (h *APIHandler) handleSimulateOpenBox(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.SimulateOpenRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	resp, err := h.store.SimulateOpenBox(id, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *APIHandler) handleDispatchGiftBox(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req model.DispatchBoxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "无效的发放参数")
		return
	}
	logEntry, err := h.store.DispatchGiftBox(id, req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, logEntry)
}

