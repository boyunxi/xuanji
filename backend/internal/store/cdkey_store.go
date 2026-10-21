package store

import (
	"crypto/rand"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

// generateUniqueCode produces a secure formatted serial key e.g. "XJ-8B1A-9F02"
func generateUniqueCode(prefix string) string {
	var b [4]byte
	_, _ = rand.Read(b[:])
	p := strings.ToUpper(strings.TrimSpace(prefix))
	if p == "" {
		p = "XJ-"
	}
	if !strings.HasSuffix(p, "-") {
		p += "-"
	}
	return fmt.Sprintf("%s%02X%02X-%02X%02X", p, b[0], b[1], b[2], b[3])
}

// GetCDKeyBatches returns CDKey batches with optional game, type, status, and search filters
func (s *DataStore) GetCDKeyBatches(game, cdkType, status, query string) []model.CDKeyBatch {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.CDKeyBatch
	qLower := strings.ToLower(strings.TrimSpace(query))

	for _, b := range s.CDKeyBatches {
		if game != "" && game != "全部游戏" && b.Game != "全部游戏" && b.Game != game {
			continue
		}
		if cdkType != "" && cdkType != "all" && b.Type != cdkType {
			continue
		}
		if status != "" && status != "全部状态" && b.Status != status {
			continue
		}
		if qLower != "" {
			matchName := strings.Contains(strings.ToLower(b.Name), qLower)
			matchCode := strings.Contains(strings.ToLower(b.Code), qLower)
			matchDesc := strings.Contains(strings.ToLower(b.Description), qLower)
			matchID := strings.Contains(strings.ToLower(b.ID), qLower)
			if !matchName && !matchCode && !matchDesc && !matchID {
				continue
			}
		}
		result = append(result, b)
	}
	return result
}

// GetCDKeyBatchByID retrieves a single batch by ID
func (s *DataStore) GetCDKeyBatchByID(id string) (*model.CDKeyBatch, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, b := range s.CDKeyBatches {
		if b.ID == id {
			copyBatch := b
			return &copyBatch, nil
		}
	}
	return nil, fmt.Errorf("兑换码批次未找到: %s", id)
}

// CreateCDKeyBatch creates a new universal code or generates a batch of unique card keys
func (s *DataStore) CreateCDKeyBatch(req model.CreateCDKeyBatchRequest) (*model.CDKeyBatch, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, fmt.Errorf("批次名称不能为空")
	}
	if len(req.Rewards) == 0 {
		return nil, fmt.Errorf("必须至少配置一项礼包奖励物品")
	}

	cdkType := req.Type
	if cdkType != model.CDKeyTypeUniversal && cdkType != model.CDKeyTypeUnique {
		cdkType = model.CDKeyTypeUniversal
	}

	expireDays := req.ExpireDays
	if expireDays <= 0 {
		expireDays = 30
	}

	now := time.Now()
	nowStr := now.Format("2006-01-02 15:04:05")
	expStr := now.AddDate(0, 0, expireDays).Format("2006-01-02 15:04:05")
	batchID := fmt.Sprintf("CDK_%s_%04d", now.Format("20060102150405"), len(s.CDKeyBatches)+1)

	game := req.Game
	if game == "" {
		game = "全部游戏"
	}

	var batch model.CDKeyBatch
	var generatedItems []model.CDKeyItem

	if cdkType == model.CDKeyTypeUniversal {
		code := strings.ToUpper(strings.TrimSpace(req.Code))
		if code == "" {
			return nil, fmt.Errorf("通用兑换码必须指定兑换字串 (如 VIP666)")
		}

		// Check uniqueness among existing universal codes
		for _, b := range s.CDKeyBatches {
			if b.Type == model.CDKeyTypeUniversal && strings.EqualFold(b.Code, code) {
				return nil, fmt.Errorf("通用兑换码 [%s] 已存在，请更换", code)
			}
		}

		totalCount := 999999
		if req.Quantity > 0 {
			totalCount = req.Quantity
		}

		batch = model.CDKeyBatch{
			ID:          batchID,
			Name:        name,
			Type:        cdkType,
			Code:        code,
			Game:        game,
			MinLevel:    req.MinLevel,
			TotalCount:  totalCount,
			UsedCount:   0,
			Status:      "已启用",
			Rewards:     req.Rewards,
			CreatedAt:   nowStr,
			ExpiresAt:   expStr,
			Description: strings.TrimSpace(req.Description),
		}
	} else {
		// Unique card keys
		quantity := req.Quantity
		if quantity <= 0 {
			quantity = 50
		}
		if quantity > 5000 {
			return nil, fmt.Errorf("单次生成独占卡密数量不得超过 5000 张")
		}

		prefix := req.Prefix
		if prefix == "" {
			prefix = "XJ-"
		}

		existingCodeMap := make(map[string]bool)
		for _, it := range s.CDKeyItems {
			existingCodeMap[it.Code] = true
		}

		for len(generatedItems) < quantity {
			c := generateUniqueCode(prefix)
			if !existingCodeMap[c] {
				existingCodeMap[c] = true
				generatedItems = append(generatedItems, model.CDKeyItem{
					Code:      c,
					BatchID:   batchID,
					Status:    "待兑换",
					PlayerID:  "",
					UsedAt:    "",
					ExpiresAt: expStr,
				})
			}
		}

		batch = model.CDKeyBatch{
			ID:          batchID,
			Name:        name,
			Type:        cdkType,
			Code:        "",
			Game:        game,
			MinLevel:    req.MinLevel,
			TotalCount:  quantity,
			UsedCount:   0,
			Status:      "已启用",
			Rewards:     req.Rewards,
			CreatedAt:   nowStr,
			ExpiresAt:   expStr,
			Description: strings.TrimSpace(req.Description),
		}
	}

	// 1. Update in-memory slices
	s.CDKeyBatches = append([]model.CDKeyBatch{batch}, s.CDKeyBatches...)
	if len(generatedItems) > 0 {
		s.CDKeyItems = append(s.CDKeyItems, generatedItems...)
	}

	// 2. Persist to PostgreSQL
	if s.db != nil {
		rewBytes, _ := json.Marshal(batch.Rewards)
		_, _ = s.db.Exec(`INSERT INTO cdkey_batches (id, name, type, code, game, min_level, total_count, used_count, status, rewards, created_at, expires_at, description)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
			batch.ID, batch.Name, batch.Type, batch.Code, batch.Game, batch.MinLevel, batch.TotalCount, batch.UsedCount, batch.Status, string(rewBytes), batch.CreatedAt, batch.ExpiresAt, batch.Description)

		if len(generatedItems) > 0 {
			tx, err := s.db.Begin()
			if err == nil {
				stmt, err := tx.Prepare(`INSERT INTO cdkey_items (code, batch_id, status, player_id, used_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)`)
				if err == nil {
					for _, it := range generatedItems {
						_, _ = stmt.Exec(it.Code, it.BatchID, it.Status, it.PlayerID, it.UsedAt, it.ExpiresAt)
					}
					_ = stmt.Close()
				}
				_ = tx.Commit()
			}
		}
	}

	// 3. Save JSON & Invalidate Redis
	_ = s.saveUnlocked()
	s.invalidateRedis("cdkeys:*", "overview:*")

	return &batch, nil
}

// ToggleCDKeyBatchStatus activates or deactivates a CDKey batch
func (s *DataStore) ToggleCDKeyBatchStatus(id string) (*model.CDKeyBatch, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var target *model.CDKeyBatch
	for i := range s.CDKeyBatches {
		if s.CDKeyBatches[i].ID == id {
			if s.CDKeyBatches[i].Status == "已启用" {
				s.CDKeyBatches[i].Status = "已停用"
			} else {
				s.CDKeyBatches[i].Status = "已启用"
			}
			target = &s.CDKeyBatches[i]
			break
		}
	}

	if target == nil {
		return nil, fmt.Errorf("未找到兑换码批次: %s", id)
	}

	if s.db != nil {
		_, _ = s.db.Exec("UPDATE cdkey_batches SET status = $1 WHERE id = $2", target.Status, id)
	}

	_ = s.saveUnlocked()
	s.invalidateRedis("cdkeys:*", "overview:*")

	return target, nil
}

// GetCDKeyItems returns cards of a unique batch with optional status & keyword filtering
func (s *DataStore) GetCDKeyItems(batchID string, status string, query string) []model.CDKeyItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.CDKeyItem
	qLower := strings.ToLower(strings.TrimSpace(query))

	for _, it := range s.CDKeyItems {
		if it.BatchID != batchID {
			continue
		}
		if status != "" && status != "全部状态" && it.Status != status {
			continue
		}
		if qLower != "" {
			matchCode := strings.Contains(strings.ToLower(it.Code), qLower)
			matchPid := strings.Contains(strings.ToLower(it.PlayerID), qLower)
			if !matchCode && !matchPid {
				continue
			}
		}
		result = append(result, it)
	}
	return result
}

// ExportCDKeyItemsCSV exports the keys of a unique batch in CSV format
func (s *DataStore) ExportCDKeyItemsCSV(batchID string) (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var batch *model.CDKeyBatch
	for _, b := range s.CDKeyBatches {
		if b.ID == batchID {
			batch = &b
			break
		}
	}
	if batch == nil {
		return "", fmt.Errorf("批次不存在: %s", batchID)
	}

	var sb strings.Builder
	writer := csv.NewWriter(&sb)

	_ = writer.Write([]string{"兑换码", "批次ID", "批次名称", "状态", "兑换玩家ID", "兑换时间", "有效期至"})

	for _, it := range s.CDKeyItems {
		if it.BatchID == batchID {
			_ = writer.Write([]string{
				it.Code,
				it.BatchID,
				batch.Name,
				it.Status,
				it.PlayerID,
				it.UsedAt,
				it.ExpiresAt,
			})
		}
	}
	writer.Flush()

	return sb.String(), nil
}

// GetCDKeyRedemptions returns verified redemption records with optional filtering
func (s *DataStore) GetCDKeyRedemptions(game, batchID, query string) []model.CDKeyRedemption {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.CDKeyRedemption
	qLower := strings.ToLower(strings.TrimSpace(query))

	for _, r := range s.CDKeyRedemptions {
		if game != "" && game != "全部游戏" && r.Game != "全部游戏" && r.Game != game {
			continue
		}
		if batchID != "" && batchID != "all" && r.BatchID != batchID {
			continue
		}
		if qLower != "" {
			matchCode := strings.Contains(strings.ToLower(r.Code), qLower)
			matchBatch := strings.Contains(strings.ToLower(r.BatchName), qLower)
			matchPid := strings.Contains(strings.ToLower(r.PlayerID), qLower)
			matchPname := strings.Contains(strings.ToLower(r.PlayerName), qLower)
			if !matchCode && !matchBatch && !matchPid && !matchPname {
				continue
			}
		}
		result = append(result, r)
	}
	return result
}

// RedeemCDKey executes verification and redemption for either universal code or unique card key
func (s *DataStore) RedeemCDKey(req model.RedeemCDKeyRequest) (*model.RedeemCDKeyResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	code := strings.ToUpper(strings.TrimSpace(req.Code))
	if code == "" {
		return nil, fmt.Errorf("请输入兑换码")
	}

	playerID := strings.TrimSpace(req.PlayerID)
	if playerID == "" {
		return nil, fmt.Errorf("请指定兑换玩家账号")
	}

	// 1. Locate player
	var player *model.Player
	for i := range s.Players {
		if s.Players[i].ID == playerID || s.Players[i].Name == playerID {
			player = &s.Players[i]
			break
		}
	}
	if player == nil {
		return nil, fmt.Errorf("未找到对应玩家档案 [%s]", playerID)
	}
	if player.Status == "已封禁" {
		return nil, fmt.Errorf("玩家账号处于封禁状态，无法兑换礼包")
	}

	now := time.Now()
	nowStr := now.Format("2006-01-02 15:04:05")

	// 2. Check if this is a Universal Code
	var universalBatch *model.CDKeyBatch
	for i := range s.CDKeyBatches {
		if s.CDKeyBatches[i].Type == model.CDKeyTypeUniversal && strings.EqualFold(s.CDKeyBatches[i].Code, code) {
			universalBatch = &s.CDKeyBatches[i]
			break
		}
	}

	if universalBatch != nil {
		if universalBatch.Status != "已启用" {
			return nil, fmt.Errorf("该兑换码已停用或失效")
		}
		if universalBatch.ExpiresAt != "" && nowStr > universalBatch.ExpiresAt {
			return nil, fmt.Errorf("该兑换码已过期失效 (过期时间: %s)", universalBatch.ExpiresAt)
		}
		if universalBatch.Game != "全部游戏" && universalBatch.Game != player.Game && (req.Game == "" || universalBatch.Game != req.Game) {
			return nil, fmt.Errorf("该礼包码仅限 [%s] 游戏兑换，玩家归属于 [%s]", universalBatch.Game, player.Game)
		}
		if player.Level < universalBatch.MinLevel {
			return nil, fmt.Errorf("角色等级未达到领奖条件 (要求 Lv.%d，当前 Lv.%d)", universalBatch.MinLevel, player.Level)
		}

		// Check if player has already redeemed this universal batch
		for _, red := range s.CDKeyRedemptions {
			if red.BatchID == universalBatch.ID && red.PlayerID == player.ID {
				return nil, fmt.Errorf("道友已兑换过此礼包码，不可重复领取")
			}
		}

		universalBatch.UsedCount++

		redemption := model.CDKeyRedemption{
			ID:         int64(len(s.CDKeyRedemptions) + 1),
			Code:       code,
			BatchID:    universalBatch.ID,
			BatchName:  universalBatch.Name,
			PlayerID:   player.ID,
			PlayerName: player.Name,
			Game:       player.Game,
			Time:       nowStr,
			Rewards:    universalBatch.Rewards,
		}
		s.CDKeyRedemptions = append([]model.CDKeyRedemption{redemption}, s.CDKeyRedemptions...)

		// Persist to DB
		if s.db != nil {
			_, _ = s.db.Exec("UPDATE cdkey_batches SET used_count = used_count + 1 WHERE id = $1", universalBatch.ID)
			rewBytes, _ := json.Marshal(redemption.Rewards)
			_, _ = s.db.Exec(`INSERT INTO cdkey_redemptions (code, batch_id, batch_name, player_id, player_name, game, time, rewards)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				redemption.Code, redemption.BatchID, redemption.BatchName, redemption.PlayerID, redemption.PlayerName, redemption.Game, redemption.Time, string(rewBytes))
		}

		_ = s.saveUnlocked()
		s.invalidateRedis("cdkeys:*", "overview:*")

		return &model.RedeemCDKeyResponse{
			Success:   true,
			Message:   fmt.Sprintf("兑换成功！奖励已派发至玩家 %s 的游戏背包", player.Name),
			BatchName: universalBatch.Name,
			PlayerID:  player.ID,
			Rewards:   universalBatch.Rewards,
			Time:      nowStr,
		}, nil
	}

	// 3. Otherwise, check if this is a Unique Card Key
	var targetItem *model.CDKeyItem
	for i := range s.CDKeyItems {
		if strings.EqualFold(s.CDKeyItems[i].Code, code) {
			targetItem = &s.CDKeyItems[i]
			break
		}
	}

	if targetItem == nil {
		return nil, fmt.Errorf("无效的兑换码，请检查卡密输入是否正确")
	}

	if targetItem.Status != "待兑换" {
		return nil, fmt.Errorf("该兑换码已于 %s 被使用或已失效", targetItem.UsedAt)
	}

	if targetItem.ExpiresAt != "" && nowStr > targetItem.ExpiresAt {
		return nil, fmt.Errorf("该兑换码已过期失效 (过期时间: %s)", targetItem.ExpiresAt)
	}

	// Find parent batch
	var parentBatch *model.CDKeyBatch
	for i := range s.CDKeyBatches {
		if s.CDKeyBatches[i].ID == targetItem.BatchID {
			parentBatch = &s.CDKeyBatches[i]
			break
		}
	}
	if parentBatch == nil {
		return nil, fmt.Errorf("兑换码批次已丢失")
	}
	if parentBatch.Status != "已启用" {
		return nil, fmt.Errorf("该兑换码所属批次已被管理员停用")
	}
	if parentBatch.Game != "全部游戏" && parentBatch.Game != player.Game && (req.Game == "" || parentBatch.Game != req.Game) {
		return nil, fmt.Errorf("该礼包码仅限 [%s] 游戏兑换，玩家归属于 [%s]", parentBatch.Game, player.Game)
	}
	if player.Level < parentBatch.MinLevel {
		return nil, fmt.Errorf("角色等级未达到领奖条件 (要求 Lv.%d，当前 Lv.%d)", parentBatch.MinLevel, player.Level)
	}

	// Update item
	targetItem.Status = "已兑换"
	targetItem.PlayerID = player.ID
	targetItem.UsedAt = nowStr
	parentBatch.UsedCount++

	redemption := model.CDKeyRedemption{
		ID:         int64(len(s.CDKeyRedemptions) + 1),
		Code:       code,
		BatchID:    parentBatch.ID,
		BatchName:  parentBatch.Name,
		PlayerID:   player.ID,
		PlayerName: player.Name,
		Game:       player.Game,
		Time:       nowStr,
		Rewards:    parentBatch.Rewards,
	}
	s.CDKeyRedemptions = append([]model.CDKeyRedemption{redemption}, s.CDKeyRedemptions...)

	// Persist to DB
	if s.db != nil {
		_, _ = s.db.Exec("UPDATE cdkey_items SET status = '已兑换', player_id = $1, used_at = $2 WHERE code = $3", player.ID, nowStr, targetItem.Code)
		_, _ = s.db.Exec("UPDATE cdkey_batches SET used_count = used_count + 1 WHERE id = $1", parentBatch.ID)
		rewBytes, _ := json.Marshal(redemption.Rewards)
		_, _ = s.db.Exec(`INSERT INTO cdkey_redemptions (code, batch_id, batch_name, player_id, player_name, game, time, rewards)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			redemption.Code, redemption.BatchID, redemption.BatchName, redemption.PlayerID, redemption.PlayerName, redemption.Game, redemption.Time, string(rewBytes))
	}

	_ = s.saveUnlocked()
	s.invalidateRedis("cdkeys:*", "overview:*")

	return &model.RedeemCDKeyResponse{
		Success:   true,
		Message:   fmt.Sprintf("独占卡密核销成功！奖励已派发至玩家 %s 的游戏背包", player.Name),
		BatchName: parentBatch.Name,
		PlayerID:  player.ID,
		Rewards:   parentBatch.Rewards,
		Time:      nowStr,
	}, nil
}
