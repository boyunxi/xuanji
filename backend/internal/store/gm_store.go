package store

import (
	"context"
	"fmt"
	"time"

	"xuanji-backend/internal/model"
)

// --- GM Tool Operations ---

func (s *DataStore) GetGMLogs() []model.GMLog {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]model.GMLog, len(s.GMLogs))
	copy(res, s.GMLogs)
	return res
}

func (s *DataStore) SendGMItem(req model.GMItemRequest) (*model.GMLog, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   "发放道具",
		Target:   fmt.Sprintf("%s · %s", req.Game, req.PlayerID),
		Detail:   fmt.Sprintf("发放 %s x%d (原因: %s)", req.ItemName, req.Amount, req.Reason),
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   "成功",
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	return &logEntry, nil
}

func (s *DataStore) SendGMBroadcast(req model.GMBroadcastRequest) (*model.GMLog, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	priority := req.Priority
	if priority == "" {
		priority = "系统"
	}

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   "全服广播",
		Target:   req.Game,
		Detail:   fmt.Sprintf("[%s跑马灯] %s", priority, req.Content),
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   "成功",
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	return &logEntry, nil
}

func (s *DataStore) ExecuteGMCommand(req model.GMCommandRequest) (*model.GMLog, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	actionName := "执行指令"
	detail := req.Command
	switch req.Command {
	case "reload_config":
		actionName = "重载配表"
		detail = "全区服游戏掉落与数值配置表已热重载完成"
	case "kick_player":
		actionName = "强制下线"
		detail = fmt.Sprintf("强制踢出玩家 [%s] 下线并注销会话", req.Target)
	case "clear_cache":
		actionName = "清空缓存"
		detail = "已清空跨服排行榜与工会战实时内存缓存"
		// If Redis is present, flush Redis cache!
		if s.rdb != nil {
			ctx, cancel := context.WithTimeout(context.Background(), time.Second)
			_ = s.rdb.FlushDB(ctx).Err()
			cancel()
		}
	case "toggle_whitelist":
		actionName = "白名单维护"
		detail = fmt.Sprintf("维护模式白名单已更新: %s", req.Params)
	}

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   actionName,
		Target:   ifThen(req.Target != "", req.Target, "全服服务器"),
		Detail:   detail,
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   "成功",
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	return &logEntry, nil
}
