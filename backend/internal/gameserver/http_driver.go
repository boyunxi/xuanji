package gameserver

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// HttpDriver sends real HTTP REST/Webhook calls to external game servers
type HttpDriver struct {
	cfg    DriverConfig
	client *http.Client
}

// NewHttpDriver creates a new HTTP driver instance
func NewHttpDriver(cfg DriverConfig) *HttpDriver {
	timeout := 5 * time.Second
	if cfg.TimeoutSec > 0 {
		timeout = time.Duration(cfg.TimeoutSec) * time.Second
	}

	return &HttpDriver{
		cfg: cfg,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

func (h *HttpDriver) Name() string {
	return "http"
}

// getServerURL resolves the server endpoint for a given game/zone
func (h *HttpDriver) getServerURL(game string) string {
	if game != "" && h.cfg.ServerNodes != nil {
		if u, exists := h.cfg.ServerNodes[game]; exists && u != "" {
			return strings.TrimRight(u, "/")
		}
	}
	return strings.TrimRight(h.cfg.DefaultURL, "/")
}

// applyAuth signs or decorates the request with configured auth headers
func (h *HttpDriver) applyAuth(req *http.Request, body []byte) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Xuanji-GM-Gateway/1.0")

	switch strings.ToLower(h.cfg.AuthType) {
	case "bearer":
		if h.cfg.AuthToken != "" {
			req.Header.Set("Authorization", "Bearer "+h.cfg.AuthToken)
		}
	case "header":
		hName := h.cfg.HeaderName
		if hName == "" {
			hName = "X-GM-Token"
		}
		if h.cfg.AuthToken != "" {
			req.Header.Set(hName, h.cfg.AuthToken)
		}
	case "hmac_sha256":
		ts := strconv.FormatInt(time.Now().Unix(), 10)
		mac := hmac.New(sha256.New, []byte(h.cfg.SecretKey))
		mac.Write([]byte(ts + "\n" + string(body)))
		signature := hex.EncodeToString(mac.Sum(nil))
		req.Header.Set("X-Timestamp", ts)
		req.Header.Set("X-Signature", signature)
	case "md5":
		ts := strconv.FormatInt(time.Now().Unix(), 10)
		hasher := md5.New()
		hasher.Write([]byte(string(body) + "&secret=" + h.cfg.SecretKey + "&ts=" + ts))
		signature := hex.EncodeToString(hasher.Sum(nil))
		req.Header.Set("X-Timestamp", ts)
		req.Header.Set("X-Signature", signature)
	}
}

// post sends a JSON request to the external game server
func (h *HttpDriver) post(ctx context.Context, game, path string, payload interface{}) (*ActionResult, error) {
	baseURL := h.getServerURL(game)
	endpoint := baseURL + path

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	h.applyAuth(req, bodyBytes)

	resp, err := h.client.Do(req)
	if err != nil {
		return &ActionResult{
			Success: false,
			Message: fmt.Sprintf("连接游戏服失败: %v", err),
		}, err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	rawResp := string(respBytes)

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		// Attempt to parse standard code/msg envelope
		var envelope struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
			Msg     string `json:"msg"`
			Success *bool  `json:"success"`
		}
		if err := json.Unmarshal(respBytes, &envelope); err == nil {
			msg := envelope.Message
			if msg == "" {
				msg = envelope.Msg
			}
			isSuccess := envelope.Code == 0
			if envelope.Success != nil {
				isSuccess = *envelope.Success
			}
			if !isSuccess {
				if msg == "" {
					msg = fmt.Sprintf("游戏服业务报错, 错误码: %d", envelope.Code)
				}
				return &ActionResult{
					Success:     false,
					Message:     msg,
					RawResponse: rawResp,
				}, fmt.Errorf("game server error %d: %s", envelope.Code, msg)
			}
			if msg == "" {
				msg = "操作执行成功"
			}
			return &ActionResult{
				Success:     true,
				Message:     msg,
				RawResponse: rawResp,
			}, nil
		}

		// Fallback for non-enveloped 2xx responses
		return &ActionResult{
			Success:     true,
			Message:     "操作已发送",
			RawResponse: rawResp,
		}, nil
	}

	errMsg := fmt.Sprintf("游戏服响应异常状态码 %d: %s", resp.StatusCode, rawResp)
	return &ActionResult{
		Success:     false,
		Message:     errMsg,
		RawResponse: rawResp,
	}, fmt.Errorf("http error %d", resp.StatusCode)
}

func (h *HttpDriver) SendItem(ctx context.Context, p SendItemPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/item/send", p)
}

func (h *HttpDriver) KickPlayer(ctx context.Context, p KickPlayerPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/player/kick", p)
}

func (h *HttpDriver) SetPlayerStatus(ctx context.Context, p PlayerStatusPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/player/status", p)
}

func (h *HttpDriver) BroadcastNotice(ctx context.Context, p BroadcastPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/broadcast", p)
}

func (h *HttpDriver) ExecuteCommand(ctx context.Context, p CommandPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/command", p)
}

func (h *HttpDriver) DispatchMail(ctx context.Context, p MailPayload) (*ActionResult, error) {
	return h.post(ctx, p.Game, "/api/gm/mail/send", p)
}

func (h *HttpDriver) Ping(ctx context.Context, game string) (*PingResult, error) {
	baseURL := h.getServerURL(game)
	endpoint := baseURL + "/api/gm/ping"

	start := time.Now()
	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return &PingResult{
			Success:    false,
			LatencyMs:  0,
			ServerName: baseURL,
			Message:    err.Error(),
			Driver:     h.Name(),
		}, err
	}

	h.applyAuth(req, nil)

	resp, err := h.client.Do(req)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return &PingResult{
			Success:    false,
			LatencyMs:  latency,
			ServerName: baseURL,
			Message:    fmt.Sprintf("Ping超时或拒绝连接: %v", err),
			Driver:     h.Name(),
		}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return &PingResult{
			Success:    true,
			LatencyMs:  latency,
			ServerName: baseURL,
			Message:    "连接畅通",
			Driver:     h.Name(),
		}, nil
	}

	return &PingResult{
		Success:    false,
		LatencyMs:  latency,
		ServerName: baseURL,
		Message:    fmt.Sprintf("游戏服响应 HTTP %d", resp.StatusCode),
		Driver:     h.Name(),
	}, fmt.Errorf("ping returned HTTP %d", resp.StatusCode)
}
