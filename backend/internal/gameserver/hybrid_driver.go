package gameserver

import (
	"context"
	"fmt"
)

// HybridDriver routes directed actions via HTTP and cluster-wide broadcasts via Redis Pub/Sub
type HybridDriver struct {
	httpDriver  Driver
	redisDriver Driver
}

func NewHybridDriver(httpDriver Driver, redisDriver Driver) *HybridDriver {
	return &HybridDriver{
		httpDriver:  httpDriver,
		redisDriver: redisDriver,
	}
}

func (h *HybridDriver) Name() string {
	return "hybrid"
}

func (h *HybridDriver) SendItem(ctx context.Context, p SendItemPayload) (*ActionResult, error) {
	// Targeted operation -> HTTP
	return h.httpDriver.SendItem(ctx, p)
}

func (h *HybridDriver) KickPlayer(ctx context.Context, p KickPlayerPayload) (*ActionResult, error) {
	// Targeted operation -> HTTP
	return h.httpDriver.KickPlayer(ctx, p)
}

func (h *HybridDriver) SetPlayerStatus(ctx context.Context, p PlayerStatusPayload) (*ActionResult, error) {
	// Targeted operation -> HTTP
	return h.httpDriver.SetPlayerStatus(ctx, p)
}

func (h *HybridDriver) BroadcastNotice(ctx context.Context, p BroadcastPayload) (*ActionResult, error) {
	// Cluster-wide broadcast -> Redis Pub/Sub
	return h.redisDriver.BroadcastNotice(ctx, p)
}

func (h *HybridDriver) ExecuteCommand(ctx context.Context, p CommandPayload) (*ActionResult, error) {
	// Targeted operation -> HTTP
	return h.httpDriver.ExecuteCommand(ctx, p)
}

func (h *HybridDriver) DispatchMail(ctx context.Context, p MailPayload) (*ActionResult, error) {
	if p.TargetType == "all" {
		// All players mail -> broadcast via Redis Pub/Sub
		return h.redisDriver.DispatchMail(ctx, p)
	}
	// Direct single-player mail -> HTTP
	return h.httpDriver.DispatchMail(ctx, p)
}

func (h *HybridDriver) Ping(ctx context.Context, game string) (*PingResult, error) {
	// Ping both HTTP and Redis to check cluster health
	httpPing, httpErr := h.httpDriver.Ping(ctx, game)
	redisPing, redisErr := h.redisDriver.Ping(ctx, game)

	if httpErr != nil && redisErr != nil {
		return &PingResult{
			Success:    false,
			LatencyMs:  0,
			ServerName: "Hybrid(HTTP+Redis)",
			Message:    fmt.Sprintf("HTTP与Redis均不可达 (HTTP: %v, Redis: %v)", httpErr, redisErr),
			Driver:     h.Name(),
		}, httpErr
	}

	totalLatency := int64(0)
	count := 0
	if httpPing != nil && httpPing.Success {
		totalLatency += httpPing.LatencyMs
		count++
	}
	if redisPing != nil && redisPing.Success {
		totalLatency += redisPing.LatencyMs
		count++
	}
	avgLatency := int64(0)
	if count > 0 {
		avgLatency = totalLatency / int64(count)
	}

	msg := fmt.Sprintf("HTTP: %s | Redis: %s", httpPing.Message, redisPing.Message)
	allOk := (httpErr == nil) && (redisErr == nil)

	return &PingResult{
		Success:    allOk,
		LatencyMs:  avgLatency,
		ServerName: "混合驱动集群节点",
		Message:    msg,
		Driver:     h.Name(),
	}, nil
}
