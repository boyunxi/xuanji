package model

// Game represents supported games
type Game = string

const (
	GameAll      Game = "全部游戏"
	GameShanhai  Game = "山海长歌"
	GameJiuzhou  Game = "九州志"
	GameYunjian  Game = "云间录"
)

// RangeKey represents time range
type RangeKey = string

const (
	RangeToday RangeKey = "today"
	RangeWeek  RangeKey = "week"
	RangeMonth RangeKey = "month"
)

// Player represents a game player
type Player struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Game       string  `json:"game"`
	Level      int     `json:"level"`
	Spend      float64 `json:"spend"`
	LastActive string  `json:"lastActive"`
	Status     string  `json:"status"` // "正常" | "已封禁"
}

// Event represents an in-game event
type Event struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Game         string `json:"game"`
	Start        string `json:"start"`
	End          string `json:"end"`
	Participants int    `json:"participants"`
	Status       string `json:"status"` // "进行中" | "未开始" | "已结束"
}

// Announcement represents a game announcement
type Announcement struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Game    string `json:"game"`
	Date    string `json:"date"`
	Content string `json:"content"`
	Status  string `json:"status"` // "已发布" | "草稿"
}

// Order represents a recharge transaction
type Order struct {
	ID     string  `json:"id"`
	Player string  `json:"player"`
	Game   string  `json:"game"`
	Amount float64 `json:"amount"`
	Method string  `json:"method"`
	Time   string  `json:"time"`
	Status string  `json:"status"` // "成功" | "处理中" | "已退款"
}

// Notice represents a system notification
type Notice struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Time  string `json:"time"`
	Page  string `json:"page"`
	Read  bool   `json:"read"`
}

// Settings represents workbench notification settings
type Settings struct {
	Daily  bool `json:"daily"`
	Orders bool `json:"orders"`
	Events bool `json:"events"`
}

// MetricItem represents a single KPI metric card
type MetricItem struct {
	Label  string `json:"label"`
	Value  string `json:"value"`
	Unit   string `json:"unit"`
	Change string `json:"change"`
	Up     bool   `json:"up"`
}

// TrendData represents chart trend
type TrendData struct {
	Labels []string  `json:"labels"`
	Values []float64 `json:"values"`
	Max    float64   `json:"max"`
}

// RevenuePart represents a slice of revenue composition
type RevenuePart struct {
	Name    string  `json:"name"`
	Percent int     `json:"percent"`
	Color   string  `json:"color"`
	Amount  float64 `json:"amount"`
}

// TodoItem represents a pending actionable item
type TodoItem struct {
	Index    string `json:"index"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Action   string `json:"action"`
	Page     string `json:"page"`
}

// ActivityItem represents recent operation log
type ActivityItem struct {
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Time     string `json:"time"`
	Page     string `json:"page"`
}

// OverviewResponse is the consolidated overview payload
type OverviewResponse struct {
	Metrics      []MetricItem   `json:"metrics"`
	Trend        TrendData      `json:"trend"`
	RevenueParts []RevenuePart  `json:"revenueParts"`
	TotalRevenue float64        `json:"totalRevenue"`
	Todos        []TodoItem     `json:"todos"`
	Activities   []ActivityItem `json:"activities"`
}

// CreateEventRequest request body
type CreateEventRequest struct {
	Title string `json:"title"`
	Game  string `json:"game"`
	Start string `json:"start"`
}

// CreateAnnouncementRequest request body
type CreateAnnouncementRequest struct {
	Title   string `json:"title"`
	Game    string `json:"game"`
	Content string `json:"content"`
}

// UpdateStatusRequest request body
type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// SearchResultItem represents an item in global Ctrl+K search
type SearchResultItem struct {
	Title    string      `json:"title"`
	Subtitle string      `json:"subtitle"`
	Page     string      `json:"page"`
	Type     string      `json:"type"` // "module" | "player" | "event" | "order"
	ID       string      `json:"id,omitempty"`
	Detail   interface{} `json:"detail,omitempty"`
}

// GMLog represents an audit log entry for GM tool operations
type GMLog struct {
	ID        string `json:"id"`
	Operator  string `json:"operator"`
	Action    string `json:"action"`    // "发放道具" | "全服广播" | "执行指令" | "重载配表"
	Target    string `json:"target"`    // "XJ100248" | "全服" | "服务器引擎"
	Detail    string `json:"detail"`
	Time      string `json:"time"`
	Status    string `json:"status"`    // "成功" | "失败"
}

// GMItemRequest request body for sending items/currencies
type GMItemRequest struct {
	Game     string `json:"game"`
	PlayerID string `json:"playerId"`
	ItemName string `json:"itemName"`
	Amount   int    `json:"amount"`
	Reason   string `json:"reason"`
}

// GMBroadcastRequest request body for sending announcements/marquees
type GMBroadcastRequest struct {
	Game     string `json:"game"`
	Content  string `json:"content"`
	Priority string `json:"priority"` // "普通" | "紧急" | "系统"
}

// GMCommandRequest request body for executing server GM commands
type GMCommandRequest struct {
	Command string `json:"command"` // "reload_config" | "kick_player" | "clear_cache" | "toggle_whitelist"
	Target  string `json:"target"`
	Params  string `json:"params"`
}

// GameInfo represents supported game entry stored in DB
type GameInfo struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	DisplayOrder int    `json:"displayOrder"`
}

// GameItem represents an in-game item definition stored in DB
type GameItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Category    string `json:"category"`
	Description string `json:"description"`
	Rarity      string `json:"rarity"` // "普通" | "稀有" | "史诗" | "传说"
	IsCustom    bool   `json:"isCustom"`
}

// CreateGameItemRequest request body for creating a custom game item
type CreateGameItemRequest struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	Description string `json:"description"`
	Rarity      string `json:"rarity"`
}

// GiftBoxType represents box type
type GiftBoxType = string

const (
	BoxTypeFixed        GiftBoxType = "fixed"         // 普通固定礼盒（直接开，全额获得全部内容）
	BoxTypeRandomProb   GiftBoxType = "random_prob"   // 随机概率礼盒（按权重概率抽取）
	BoxTypeSingleChoice GiftBoxType = "single_choice" // 自选礼盒（单选/N选1）
	BoxTypeMultiChoice  GiftBoxType = "multi_choice"  // 自选礼盒（多选/N选M）
)

// GiftBoxItem represents an item configured inside a gift box
type GiftBoxItem struct {
	ItemName    string  `json:"itemName"`
	Category    string  `json:"category"`
	Amount      int     `json:"amount"`
	Probability float64 `json:"probability"` // 0-100%, 用于随机概率礼盒
	Rarity      string  `json:"rarity,omitempty"`
}

// GiftBox represents a customizable gift box / package created by GM
type GiftBox struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Game        string        `json:"game"`
	BoxType     GiftBoxType   `json:"boxType"`
	MaxChoices  int           `json:"maxChoices"` // 用于多选礼盒（例如 2 即 N选2）
	Rarity      string        `json:"rarity"`     // "普通" | "稀有" | "史诗" | "传说"
	Icon        string        `json:"icon"`       // 图标标识
	Description string        `json:"description"`
	Status      string        `json:"status"`     // "已启用" | "已下架"
	Items       []GiftBoxItem `json:"items"`
	CreatedAt   string        `json:"createdAt"`
	UpdatedAt   string        `json:"updatedAt"`
}

// CreateGiftBoxRequest request body for creating gift box
type CreateGiftBoxRequest struct {
	ID          string        `json:"id,omitempty"`
	Name        string        `json:"name"`
	Game        string        `json:"game"`
	BoxType     GiftBoxType   `json:"boxType"`
	MaxChoices  int           `json:"maxChoices"`
	Rarity      string        `json:"rarity"`
	Icon        string        `json:"icon"`
	Description string        `json:"description"`
	Status      string        `json:"status"`
	Items       []GiftBoxItem `json:"items"`
}

// SimulateOpenRequest request body for simulating opening a box
type SimulateOpenRequest struct {
	ChosenItems []string `json:"chosenItems,omitempty"` // For single/multi choice
}

// SimulateOpenResponse result of opening a box
type SimulateOpenResponse struct {
	BoxID       string        `json:"boxId"`
	BoxName     string        `json:"boxName"`
	BoxType     GiftBoxType   `json:"boxType"`
	MaxChoices  int           `json:"maxChoices"`
	WonItems    []GiftBoxItem `json:"wonItems"`    // Items awarded from opening
	Candidates  []GiftBoxItem `json:"candidates"`  // All items inside for display
	RolledIndex int           `json:"rolledIndex"` // If random_prob, index of item drawn
	Message     string        `json:"message"`
}

// DispatchBoxRequest request body for sending gift box to player
type DispatchBoxRequest struct {
	PlayerID string `json:"playerId"`
	Amount   int    `json:"amount"`
	Reason   string `json:"reason"`
}

