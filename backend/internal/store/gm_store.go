package store

import (
	"context"
	"fmt"
	"time"

	"xuanji-backend/internal/gameserver"
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var driverErr error
	var driverMsg string
	if s.driver != nil {
		res, err := s.driver.SendItem(ctx, gameserver.SendItemPayload{
			RequestID: fmt.Sprintf("REQ_ITEM_%d", time.Now().UnixNano()),
			Game:      req.Game,
			PlayerID:  req.PlayerID,
			ItemName:  req.ItemName,
			ItemID:    req.ItemID,
			Amount:    req.Amount,
			Reason:    req.Reason,
		})
		if err != nil || (res != nil && !res.Success) {
			driverErr = err
			if res != nil && res.Message != "" {
				driverMsg = res.Message
			} else if err != nil {
				driverMsg = err.Error()
			}
		} else if res != nil && res.Message != "" {
			driverMsg = res.Message
		}
	}

	status := "成功"
	detail := fmt.Sprintf("发放 %s x%d (原因: %s)", req.ItemName, req.Amount, req.Reason)
	if driverErr != nil {
		status = "失败"
		detail = fmt.Sprintf("发放 %s x%d 失败: %s", req.ItemName, req.Amount, driverMsg)
	} else if driverMsg != "" {
		detail = fmt.Sprintf("%s [%s]", detail, driverMsg)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   "发放道具",
		Target:   fmt.Sprintf("%s · %s", req.Game, req.PlayerID),
		Detail:   detail,
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   status,
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	if driverErr != nil {
		return &logEntry, fmt.Errorf("下发道具失败: %s", driverMsg)
	}
	return &logEntry, nil
}

func (s *DataStore) SendGMBroadcast(req model.GMBroadcastRequest) (*model.GMLog, error) {
	priority := req.Priority
	if priority == "" {
		priority = "系统"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var driverErr error
	var driverMsg string
	if s.driver != nil {
		res, err := s.driver.BroadcastNotice(ctx, gameserver.BroadcastPayload{
			RequestID: fmt.Sprintf("REQ_BC_%d", time.Now().UnixNano()),
			Game:      req.Game,
			Content:   req.Content,
			Priority:  priority,
		})
		if err != nil || (res != nil && !res.Success) {
			driverErr = err
			if res != nil && res.Message != "" {
				driverMsg = res.Message
			} else if err != nil {
				driverMsg = err.Error()
			}
		} else if res != nil && res.Message != "" {
			driverMsg = res.Message
		}
	}

	status := "成功"
	detail := fmt.Sprintf("[%s跑马灯] %s", priority, req.Content)
	if driverErr != nil {
		status = "失败"
		detail = fmt.Sprintf("[%s跑马灯推送失败] %s (%s)", priority, req.Content, driverMsg)
	} else if driverMsg != "" {
		detail = fmt.Sprintf("%s [%s]", detail, driverMsg)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   "全服广播",
		Target:   req.Game,
		Detail:   detail,
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   status,
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	if driverErr != nil {
		return &logEntry, fmt.Errorf("推送广播失败: %s", driverMsg)
	}
	return &logEntry, nil
}

func (s *DataStore) ExecuteGMCommand(req model.GMCommandRequest) (*model.GMLog, error) {
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
		if s.rdb != nil {
			ctx, cancel := context.WithTimeout(context.Background(), time.Second)
			_ = s.rdb.FlushDB(ctx).Err()
			cancel()
		}
	case "toggle_whitelist":
		actionName = "白名单维护"
		detail = fmt.Sprintf("维护模式白名单已更新: %s", req.Params)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var driverErr error
	var driverMsg string
	if s.driver != nil {
		if req.Command == "kick_player" {
			res, err := s.driver.KickPlayer(ctx, gameserver.KickPlayerPayload{
				RequestID: fmt.Sprintf("REQ_KICK_%d", time.Now().UnixNano()),
				Game:      "全部游戏",
				PlayerID:  req.Target,
				Reason:    "GM后台强制踢出",
			})
			if err != nil || (res != nil && !res.Success) {
				driverErr = err
				if res != nil && res.Message != "" {
					driverMsg = res.Message
				} else if err != nil {
					driverMsg = err.Error()
				}
			} else if res != nil && res.Message != "" {
				driverMsg = res.Message
			}
		} else {
			res, err := s.driver.ExecuteCommand(ctx, gameserver.CommandPayload{
				RequestID: fmt.Sprintf("REQ_CMD_%d", time.Now().UnixNano()),
				Game:      "全部游戏",
				Command:   req.Command,
				Target:    req.Target,
				Params:    req.Params,
			})
			if err != nil || (res != nil && !res.Success) {
				driverErr = err
				if res != nil && res.Message != "" {
					driverMsg = res.Message
				} else if err != nil {
					driverMsg = err.Error()
				}
			} else if res != nil && res.Message != "" {
				driverMsg = res.Message
			}
		}
	}

	status := "成功"
	if driverErr != nil {
		status = "失败"
		detail = fmt.Sprintf("%s (执行失败: %s)", detail, driverMsg)
	} else if driverMsg != "" {
		detail = fmt.Sprintf("%s [%s]", detail, driverMsg)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   actionName,
		Target:   ifThen(req.Target != "", req.Target, "全服服务器"),
		Detail:   detail,
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   status,
	}

	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	if driverErr != nil {
		return &logEntry, fmt.Errorf("执行GM指令失败: %s", driverMsg)
	}
	return &logEntry, nil
}
