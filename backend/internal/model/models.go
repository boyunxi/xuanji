package model

// Game represents supported games
type Game = string

const (
	GameAll       Game = "全部区服"
	GameAllLegacy Game = "全部游戏"
	GameShanhai   Game = "山海长歌"
	GameJiuzhou   Game = "九州志"
	GameYunjian   Game = "云间录"
)

// IsAllGames checks if game filter represents all games/servers
func IsAllGames(g string) bool {
	return g == "" || g == "全部区服" || g == "全部游戏" || g == "all"
}

// RangeKey represents time range
type RangeKey = string

const (
	RangeToday RangeKey = "today"
	RangeWeek  RangeKey = "week"
	RangeMonth RangeKey = "month"
)

// Player represents a game player
type Player struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Game       string   `json:"game"`
	Level      int      `json:"level"`
	Spend      float64  `json:"spend"`
	LastActive string   `json:"lastActive"`
	Status     string   `json:"status"` // "正常" | "已封禁"
	Tags       []string `json:"tags"`   // 标签列表，带有标签的玩家自动置顶排在最上面
	Remark     string   `json:"remark"` // 运营人员填写的玩家备注备忘录
}

// Event represents an in-game event
type Event struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Game         string `json:"game"`
	Start        string `json:"start"`
	End          string `json:"end"`
	Participants int    `json:"participants"`
	Status       string `json:"status"` // "进行中" | "未开始" | "已暂停" | "已结束"
}

// ShopItem represents a commodity in the in-game mall
type ShopItem struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Game          string  `json:"game"`          // "全部游戏" | "山海长歌" | "九州志" | "云间录"
	Category      string  `json:"category"`      // "超值礼包" | "极品法宝" | "灵丹妙药" | "外观时装" | "货币直购"
	Currency      string  `json:"currency"`      // "仙玉" | "元宝" | "灵石" | "CNY"
	Price         float64 `json:"price"`         // 当前售价
	OriginalPrice float64 `json:"originalPrice"` // 原价 (划线价)
	Stock         int     `json:"stock"`         // -1 为不限库存
	BuyLimit      string  `json:"buyLimit"`      // "不限购" | "永久限购1次" | "每日限购3次" | "每周限购1次"
	Tag           string  `json:"tag"`           // "首充双倍" | "热销" | "限时特惠" | "爆款" | "新品"
	Description   string  `json:"description"`
	Items         string  `json:"items"`         // 包含道具说明
	Status        string  `json:"status"`        // "上架中" | "已下架"
	SortOrder     int     `json:"sortOrder"`
	CreatedAt     string  `json:"createdAt"`
	UpdatedAt     string  `json:"updatedAt"`
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

// GameLog represents an in-game behavior and server runtime event log
type GameLog struct {
	ID         string `json:"id"`
	Game       string `json:"game"`        // "山海长歌" | "九州志" | "云间录"
	ServerID   string `json:"serverId"`    // "沧海流云-1服" | "九州巅峰-2服" | "全区服"
	PlayerID   string `json:"playerId"`    // "XJ100248"
	PlayerName string `json:"playerName"`  // "听风入梦"
	Category   string `json:"category"`    // "经济流水" | "玩法战斗" | "角色成长" | "道具获取" | "安全风控" | "登录登出"
	Action     string `json:"action"`      // "通关副本" | "商城消费" | "十连抽卡" | "境界突破" | "世界Boss"
	Detail     string `json:"detail"`      // 详细流水或行为载荷
	Delta      string `json:"delta"`       // 属性/数值流动: "+500 仙玉", "-1280 灵石", "+1 极品装备"
	IP         string `json:"ip"`          // 玩家IP
	Level      string `json:"level"`       // "INFO" | "WARN" | "CRITICAL"
	Time       string `json:"time"`        // "2026-10-21 21:30:15"
}

// GMItemRequest request body for sending items/currencies
type GMItemRequest struct {
	Game     string `json:"game"`
	PlayerID string `json:"playerId"`
	ItemName string `json:"itemName"`
	ItemID   string `json:"itemId,omitempty"`
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

// MailAttachment represents an attached resource in a mail
type MailAttachment struct {
	ItemID   string `json:"itemId"`
	ItemName string `json:"itemName"`
	Category string `json:"category"`
	Amount   int    `json:"amount"`
	Rarity   string `json:"rarity"` // "普通" | "稀有" | "史诗" | "传说"
	IsBox    bool   `json:"isBox"`
}

// Mail represents an operational in-game compensation or announcement mail
type Mail struct {
	ID           string           `json:"id"`
	Title        string           `json:"title"`
	Content      string           `json:"content"`
	Sender       string           `json:"sender"`
	Game         string           `json:"game"`
	TargetType   string           `json:"targetType"` // "all" (全服) | "player" (指定玩家)
	TargetID     string           `json:"targetId"`   // "ALL" 或 玩家ID/名称
	MinLevel     int              `json:"minLevel"`
	Status       string           `json:"status"` // "已发送" | "草稿" | "已撤回"
	Attachments  []MailAttachment `json:"attachments"`
	SentAt       string           `json:"sentAt"`
	ExpiresAt    string           `json:"expiresAt"`
	ClaimedCount int              `json:"claimedCount"`
	TotalTarget  int              `json:"totalTarget"`
}

// CreateMailRequest is payload for drafting or dispatching a mail
type CreateMailRequest struct {
	Title       string           `json:"title"`
	Content     string           `json:"content"`
	Sender      string           `json:"sender"`
	Game        string           `json:"game"`
	TargetType  string           `json:"targetType"`
	TargetID    string           `json:"targetId"`
	MinLevel    int              `json:"minLevel"`
	ExpireDays  int              `json:"expireDays"`
	Attachments []MailAttachment `json:"attachments"`
	IsDraft     bool             `json:"isDraft"`
}

// CDKeyType represents universal or unique batch
type CDKeyType = string

const (
	CDKeyTypeUniversal CDKeyType = "universal" // 通用兑换码 (一码多兑, 限制单人1次)
	CDKeyTypeUnique    CDKeyType = "unique"    // 独占兑换码 (一码一兑, 批量发卡密)
)

// CDKeyReward represents an item or gift box rewarded by a CDKey
type CDKeyReward struct {
	ItemID   string `json:"itemId"`
	ItemName string `json:"itemName"`
	Category string `json:"category"`
	Amount   int    `json:"amount"`
	Rarity   string `json:"rarity"`
	IsBox    bool   `json:"isBox"`
}

// CDKeyBatch represents a CDKey configuration batch
type CDKeyBatch struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Type        CDKeyType     `json:"type"`
	Code        string        `json:"code"`
	Game        string        `json:"game"`
	MinLevel    int           `json:"minLevel"`
	TotalCount  int           `json:"totalCount"`
	UsedCount   int           `json:"usedCount"`
	Status      string        `json:"status"` // "已启用" | "已停用" | "已过期"
	Rewards     []CDKeyReward `json:"rewards"`
	CreatedAt   string        `json:"createdAt"`
	ExpiresAt   string        `json:"expiresAt"`
	Description string        `json:"description"`
}

// CDKeyItem represents an individual card key in a unique batch
type CDKeyItem struct {
	Code      string `json:"code"`
	BatchID   string `json:"batchId"`
	Status    string `json:"status"` // "待兑换" | "已兑换" | "已作废"
	PlayerID  string `json:"playerId,omitempty"`
	UsedAt    string `json:"usedAt,omitempty"`
	ExpiresAt string `json:"expiresAt"`
}

// CDKeyRedemption represents a verified redemption transaction log
type CDKeyRedemption struct {
	ID         int64         `json:"id"`
	Code       string        `json:"code"`
	BatchID    string        `json:"batchId"`
	BatchName  string        `json:"batchName"`
	PlayerID   string        `json:"playerId"`
	PlayerName string        `json:"playerName"`
	Game       string        `json:"game"`
	Time       string        `json:"time"`
	Rewards    []CDKeyReward `json:"rewards"`
}

// CreateCDKeyBatchRequest request body to create a CDKey batch
type CreateCDKeyBatchRequest struct {
	Name        string        `json:"name"`
	Type        CDKeyType     `json:"type"`
	Code        string        `json:"code"`
	Prefix      string        `json:"prefix"`
	Quantity    int           `json:"quantity"`
	Game        string        `json:"game"`
	MinLevel    int           `json:"minLevel"`
	ExpireDays  int           `json:"expireDays"`
	Rewards     []CDKeyReward `json:"rewards"`
	Description string        `json:"description"`
}

// RedeemCDKeyRequest request body for player or GM to redeem a CDKey
type RedeemCDKeyRequest struct {
	Code     string `json:"code"`
	PlayerID string `json:"playerId"`
	Game     string `json:"game"`
}

// RedeemCDKeyResponse result of a successful redemption
type RedeemCDKeyResponse struct {
	Success   bool          `json:"success"`
	Message   string        `json:"message"`
	BatchName string        `json:"batchName"`
	PlayerID  string        `json:"playerId"`
	Rewards   []CDKeyReward `json:"rewards"`
	Time      string        `json:"time"`
}


