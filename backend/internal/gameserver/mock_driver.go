package gameserver

import (
	"context"
	"fmt"
)

// MockDriver provides in-memory local simulation of game server actions
type MockDriver struct{}

func NewMockDriver() *MockDriver {
	return &MockDriver{}
}

func (m *MockDriver) Name() string {
	return "mock"
}

func (m *MockDriver) SendItem(ctx context.Context, p SendItemPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] 道具 %s x%d 已模拟下发给玩家 %s", p.ItemName, p.Amount, p.PlayerID),
		RawResponse: `{"code":0,"msg":"success"}`,
	}, nil
}

func (m *MockDriver) KickPlayer(ctx context.Context, p KickPlayerPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] 玩家 %s 已模拟执行断线请离", p.PlayerID),
		RawResponse: `{"code":0,"msg":"kicked"}`,
	}, nil
}

func (m *MockDriver) SetPlayerStatus(ctx context.Context, p PlayerStatusPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] 玩家 %s 状态已切换为: %s", p.PlayerID, p.Status),
		RawResponse: `{"code":0,"msg":"updated"}`,
	}, nil
}

func (m *MockDriver) BroadcastNotice(ctx context.Context, p BroadcastPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] 跑马灯已模拟推送至游戏 [%s]: %s", p.Game, p.Content),
		RawResponse: `{"code":0,"msg":"broadcasted"}`,
	}, nil
}

func (m *MockDriver) ExecuteCommand(ctx context.Context, p CommandPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] GM指令 [%s] 目标 [%s] 参数 [%s] 执行成功", p.Command, p.Target, p.Params),
		RawResponse: `{"code":0,"msg":"executed"}`,
	}, nil
}

func (m *MockDriver) DispatchMail(ctx context.Context, p MailPayload) (*ActionResult, error) {
	return &ActionResult{
		Success:     true,
		Message:     fmt.Sprintf("[Mock] 邮件 [%s] 标的 [%s] 已模拟派发", p.Title, p.TargetID),
		RawResponse: `{"code":0,"msg":"dispatched"}`,
	}, nil
}

func (m *MockDriver) Ping(ctx context.Context, game string) (*PingResult, error) {
	return &PingResult{
		Success:    true,
		LatencyMs:  1,
		ServerName: "本地模拟仿真节点",
		Message:    "Mock 驱动运行正常，无需真实外接服务器",
		Driver:     m.Name(),
	}, nil
}
