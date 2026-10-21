package gameserver

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/redis/go-redis/v9"
)

// ActionResult standardized result returned by game server operations
type ActionResult struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	RawResponse string `json:"rawResponse,omitempty"`
}

// PingResult server connectivity test result
type PingResult struct {
	Success    bool   `json:"success"`
	LatencyMs  int64  `json:"latencyMs"`
	ServerName string `json:"serverName"`
	Message    string `json:"message"`
	Driver     string `json:"driver"`
}

// Payloads for standard operations

type SendItemPayload struct {
	RequestID string `json:"requestId"`
	Game      string `json:"game"`
	PlayerID  string `json:"playerId"`
	ItemName  string `json:"itemName"`
	ItemID    string `json:"itemId,omitempty"`
	Amount    int    `json:"amount"`
	Reason    string `json:"reason"`
}

type KickPlayerPayload struct {
	RequestID string `json:"requestId"`
	Game      string `json:"game"`
	PlayerID  string `json:"playerId"`
	Reason    string `json:"reason"`
}

type PlayerStatusPayload struct {
	RequestID string `json:"requestId"`
	Game      string `json:"game"`
	PlayerID  string `json:"playerId"`
	Status    string `json:"status"` // "正常" | "已封禁"
	Reason    string `json:"reason"`
}

type BroadcastPayload struct {
	RequestID string `json:"requestId"`
	Game      string `json:"game"`
	Content   string `json:"content"`
	Priority  string `json:"priority"` // "普通" | "紧急" | "系统"
}

type CommandPayload struct {
	RequestID string `json:"requestId"`
	Game      string `json:"game"`
	Command   string `json:"command"`
	Target    string `json:"target"`
	Params    string `json:"params"`
}

type MailPayload struct {
	RequestID   string      `json:"requestId"`
	Game        string      `json:"game"`
	MailID      string      `json:"mailId"`
	Title       string      `json:"title"`
	Content     string      `json:"content"`
	TargetType  string      `json:"targetType"` // "all" | "player"
	TargetID    string      `json:"targetId"`
	MinLevel    int         `json:"minLevel"`
	Attachments interface{} `json:"attachments"`
}

// Driver unified interface for game server communication adapters
type Driver interface {
	Name() string
	SendItem(ctx context.Context, payload SendItemPayload) (*ActionResult, error)
	KickPlayer(ctx context.Context, payload KickPlayerPayload) (*ActionResult, error)
	SetPlayerStatus(ctx context.Context, payload PlayerStatusPayload) (*ActionResult, error)
	BroadcastNotice(ctx context.Context, payload BroadcastPayload) (*ActionResult, error)
	ExecuteCommand(ctx context.Context, payload CommandPayload) (*ActionResult, error)
	DispatchMail(ctx context.Context, payload MailPayload) (*ActionResult, error)
	Ping(ctx context.Context, game string) (*PingResult, error)
}

// DriverConfig holds common configuration for game server adapters
type DriverConfig struct {
	DriverType    string            `json:"driverType"` // "mock" | "http" | "redis" | "hybrid"
	DefaultURL    string            `json:"defaultUrl"`
	ServerNodes   map[string]string `json:"serverNodes"` // Game/Zone to URL mapping
	AuthType      string            `json:"authType"`    // "none" | "bearer" | "header" | "hmac_sha256" | "md5"
	SecretKey     string            `json:"-"`
	AuthToken     string            `json:"-"`
	HeaderName    string            `json:"headerName"` // for "header" auth type, default "X-GM-Token"
	TimeoutSec    int               `json:"timeoutSec"`
}

// LoadConfigFromEnv reads configuration from environment variables
func LoadConfigFromEnv() DriverConfig {
	driverType := strings.ToLower(strings.TrimSpace(os.Getenv("GAME_SERVER_DRIVER")))
	if driverType == "" {
		driverType = "mock" // default to mock to ensure zero-dependency local compatibility
	}

	authType := strings.ToLower(strings.TrimSpace(os.Getenv("GAME_SERVER_AUTH_TYPE")))
	if authType == "" {
		authType = "none"
	}

	headerName := os.Getenv("GAME_SERVER_HEADER_NAME")
	if headerName == "" {
		headerName = "X-GM-Token"
	}

	defaultURL := os.Getenv("GAME_SERVER_HTTP_URL")
	if defaultURL == "" {
		defaultURL = "http://127.0.0.1:9000"
	}

	serverNodes := make(map[string]string)
	nodesJSON := os.Getenv("GAME_SERVER_SERVERS_JSON")
	if nodesJSON != "" {
		_ = json.Unmarshal([]byte(nodesJSON), &serverNodes)
	}

	return DriverConfig{
		DriverType:  driverType,
		DefaultURL:  defaultURL,
		ServerNodes: serverNodes,
		AuthType:    authType,
		SecretKey:   os.Getenv("GAME_SERVER_SECRET"),
		AuthToken:   os.Getenv("GAME_SERVER_TOKEN"),
		HeaderName:  headerName,
		TimeoutSec:  5,
	}
}

// NewDriver creates the appropriate driver according to configuration
func NewDriver(rdb *redis.Client) Driver {
	cfg := LoadConfigFromEnv()
	log.Printf("[GameServer] Initializing driver: %s (Auth: %s, DefaultURL: %s)", cfg.DriverType, cfg.AuthType, cfg.DefaultURL)

	switch cfg.DriverType {
	case "http", "webhook", "rest":
		return NewHttpDriver(cfg)
	case "redis", "pubsub":
		return NewRedisPubSubDriver(rdb, cfg)
	case "hybrid":
		return NewHybridDriver(NewHttpDriver(cfg), NewRedisPubSubDriver(rdb, cfg))
	case "mock":
		fallthrough
	default:
		return NewMockDriver()
	}
}
