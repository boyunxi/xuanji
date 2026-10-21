package gameserver

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisPubSubDriver broadcasts GM operations to game servers via Redis Pub/Sub channels
type RedisPubSubDriver struct {
	rdb *redis.Client
	cfg DriverConfig
}

func NewRedisPubSubDriver(rdb *redis.Client, cfg DriverConfig) *RedisPubSubDriver {
	return &RedisPubSubDriver{
		rdb: rdb,
		cfg: cfg,
	}
}

func (r *RedisPubSubDriver) Name() string {
	return "redis"
}

func (r *RedisPubSubDriver) publish(ctx context.Context, channelSuffix string, payload interface{}) (*ActionResult, error) {
	if r.rdb == nil {
		return &ActionResult{
			Success: false,
			Message: "Redis 未连接，无法发布 Pub/Sub 消息",
		}, errors.New("redis client is nil")
	}

	channel := "xuanji:events:" + channelSuffix
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	receivers, err := r.rdb.Publish(ctx, channel, string(bodyBytes)).Result()
	if err != nil {
		return &ActionResult{
			Success: false,
			Message: fmt.Sprintf("发布 Redis 消息失败: %v", err),
		}, err
	}

	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("已推送至频道 [%s], 实时监听节点数: %d", channel, receivers),
		RawResponse: fmt.Sprintf(`{"channel":"%s","subscribers":%d}`, channel, receivers),
	}, nil
}

func (r *RedisPubSubDriver) SendItem(ctx context.Context, p SendItemPayload) (*ActionResult, error) {
	return r.publish(ctx, "item", p)
}

func (r *RedisPubSubDriver) KickPlayer(ctx context.Context, p KickPlayerPayload) (*ActionResult, error) {
	return r.publish(ctx, "kick", p)
}

func (r *RedisPubSubDriver) SetPlayerStatus(ctx context.Context, p PlayerStatusPayload) (*ActionResult, error) {
	return r.publish(ctx, "status", p)
}

func (r *RedisPubSubDriver) BroadcastNotice(ctx context.Context, p BroadcastPayload) (*ActionResult, error) {
	return r.publish(ctx, "broadcast", p)
}

func (r *RedisPubSubDriver) ExecuteCommand(ctx context.Context, p CommandPayload) (*ActionResult, error) {
	return r.publish(ctx, "command", p)
}

func (r *RedisPubSubDriver) DispatchMail(ctx context.Context, p MailPayload) (*ActionResult, error) {
	return r.publish(ctx, "mail", p)
}

func (r *RedisPubSubDriver) Ping(ctx context.Context, game string) (*PingResult, error) {
	if r.rdb == nil {
		return &PingResult{
			Success:    false,
			LatencyMs:  0,
			ServerName: "Redis Pub/Sub",
			Message:    "Redis 客户端未初始化",
			Driver:     r.Name(),
		}, errors.New("redis client is nil")
	}

	start := time.Now()
	res, err := r.rdb.Ping(ctx).Result()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return &PingResult{
			Success:    false,
			LatencyMs:  latency,
			ServerName: "Redis Pub/Sub",
			Message:    fmt.Sprintf("Redis 异常: %v", err),
			Driver:     r.Name(),
		}, err
	}

	return &PingResult{
		Success:    true,
		LatencyMs:  latency,
		ServerName: "Redis 消息中继集群",
		Message:    fmt.Sprintf("Redis 连通正常 (%s)", res),
		Driver:     r.Name(),
	}, nil
}
