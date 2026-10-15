package store

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

// --- Game Items ---

func (s *DataStore) GetItems(category, q string) []model.GameItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var res []model.GameItem
	q = strings.ToLower(strings.TrimSpace(q))

	for _, item := range s.Items {
		if category != "" && category != "全部" && item.Category != category {
			continue
		}
		if q != "" {
			nameMatch := strings.Contains(strings.ToLower(item.Name), q)
			catMatch := strings.Contains(strings.ToLower(item.Category), q)
			descMatch := strings.Contains(strings.ToLower(item.Description), q)
			if !nameMatch && !catMatch && !descMatch {
				continue
			}
		}
		res = append(res, item)
	}
	return res
}

func (s *DataStore) CreateItem(req model.CreateGameItemRequest) (*model.GameItem, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, fmt.Errorf("道具名称不能为空")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, it := range s.Items {
		if it.Name == name {
			return nil, fmt.Errorf("道具「%s」已存在", name)
		}
	}

	itemID := fmt.Sprintf("ITEM_%d", time.Now().UnixNano()%1000000)
	cat := req.Category
	if cat == "" {
		cat = "定制道具"
	}
	rarity := req.Rarity
	if rarity == "" {
		rarity = "史诗"
	}

	it := model.GameItem{
		ID:          itemID,
		Name:        name,
		Category:    cat,
		Description: req.Description,
		Rarity:      rarity,
		IsCustom:    true,
	}

	s.Items = append(s.Items, it)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO game_items (id, name, category, description, rarity, is_custom) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
			it.ID, it.Name, it.Category, it.Description, it.Rarity, it.IsCustom)
	}

	s.invalidateRedis("xuanji:items*")
	return &it, nil
}

// --- Gift Boxes (GM Custom Package System) ---

func (s *DataStore) GetGiftBoxes(game, boxType, status, q string) []model.GiftBox {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.GiftBox
	q = strings.ToLower(strings.TrimSpace(q))

	for _, b := range s.GiftBoxes {
		if game != "" && game != "全部游戏" && b.Game != "全部游戏" && b.Game != game {
			continue
		}
		if boxType != "" && boxType != "全部类型" && b.BoxType != boxType {
			continue
		}
		if status != "" && status != "全部状态" && b.Status != status {
			continue
		}
		if q != "" {
			idMatch := strings.Contains(strings.ToLower(b.ID), q)
			nameMatch := strings.Contains(strings.ToLower(b.Name), q)
			descMatch := strings.Contains(strings.ToLower(b.Description), q)
			itemMatch := false
			for _, it := range b.Items {
				if strings.Contains(strings.ToLower(it.ItemName), q) {
					itemMatch = true
					break
				}
			}
			if !idMatch && !nameMatch && !descMatch && !itemMatch {
				continue
			}
		}
		result = append(result, b)
	}
	return result
}

func (s *DataStore) GetGiftBox(id string) (*model.GiftBox, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, b := range s.GiftBoxes {
		if b.ID == id {
			c := b
			return &c, nil
		}
	}
	return nil, fmt.Errorf("礼盒不存在")
}

func (s *DataStore) CreateGiftBox(req model.CreateGiftBoxRequest) (*model.GiftBox, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if strings.TrimSpace(req.Name) == "" {
		return nil, fmt.Errorf("礼盒名称不能为空")
	}
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("礼盒至少需要配置 1 个物品")
	}

	boxType := req.BoxType
	if boxType == "" {
		boxType = model.BoxTypeFixed
	}

	maxChoices := req.MaxChoices
	if boxType == model.BoxTypeMultiChoice {
		if maxChoices < 1 {
			maxChoices = 2
		}
		if maxChoices > len(req.Items) {
			maxChoices = len(req.Items)
		}
	} else {
		maxChoices = 1
	}

	rarity := req.Rarity
	if rarity == "" {
		rarity = "史诗"
	}

	icon := req.Icon
	if icon == "" {
		icon = "box"
	}

	status := req.Status
	if status == "" {
		status = "已启用"
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	boxID := strings.TrimSpace(req.ID)
	if boxID == "" {
		for {
			candidate := fmt.Sprintf("BOX_%06d", time.Now().UnixNano()%1000000)
			exists := false
			for _, b := range s.GiftBoxes {
				if b.ID == candidate {
					exists = true
					break
				}
			}
			if !exists {
				boxID = candidate
				break
			}
			time.Sleep(time.Millisecond)
		}
	}

	box := model.GiftBox{
		ID:          boxID,
		Name:        req.Name,
		Game:        req.Game,
		BoxType:     boxType,
		MaxChoices:  maxChoices,
		Rarity:      rarity,
		Icon:        icon,
		Description: req.Description,
		Status:      status,
		Items:       req.Items,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.GiftBoxes = append([]model.GiftBox{box}, s.GiftBoxes...)
	_ = s.saveUnlocked()

	if s.db != nil {
		itemsJSON, _ := json.Marshal(box.Items)
		_, err := s.db.Exec(`INSERT INTO gift_boxes (id, name, game, box_type, max_choices, rarity, icon, description, status, items, created_at, updated_at) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			box.ID, box.Name, box.Game, box.BoxType, box.MaxChoices, box.Rarity, box.Icon, box.Description, box.Status, string(itemsJSON), box.CreatedAt, box.UpdatedAt)
		if err != nil {
			log.Printf("[PostgreSQL] Error inserting gift box: %v", err)
		}
	}

	s.invalidateRedis("xuanji:gift_boxes*")
	return &box, nil
}

func (s *DataStore) UpdateGiftBox(id string, req model.CreateGiftBoxRequest) (*model.GiftBox, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, b := range s.GiftBoxes {
		if b.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, fmt.Errorf("礼盒不存在")
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	b := &s.GiftBoxes[idx]
	if req.Name != "" {
		b.Name = req.Name
	}
	if req.Game != "" {
		b.Game = req.Game
	}
	if req.BoxType != "" {
		b.BoxType = req.BoxType
	}
	if req.BoxType == model.BoxTypeMultiChoice {
		b.MaxChoices = req.MaxChoices
		if b.MaxChoices < 1 {
			b.MaxChoices = 2
		}
	} else {
		b.MaxChoices = 1
	}
	if req.Rarity != "" {
		b.Rarity = req.Rarity
	}
	if req.Icon != "" {
		b.Icon = req.Icon
	}
	b.Description = req.Description
	if req.Status != "" {
		b.Status = req.Status
	}
	if len(req.Items) > 0 {
		b.Items = req.Items
	}
	b.UpdatedAt = now

	_ = s.saveUnlocked()

	if s.db != nil {
		itemsJSON, _ := json.Marshal(b.Items)
		_, _ = s.db.Exec(`UPDATE gift_boxes SET name=$1, game=$2, box_type=$3, max_choices=$4, rarity=$5, icon=$6, description=$7, status=$8, items=$9, updated_at=$10 WHERE id=$11`,
			b.Name, b.Game, b.BoxType, b.MaxChoices, b.Rarity, b.Icon, b.Description, b.Status, string(itemsJSON), b.UpdatedAt, id)
	}

	s.invalidateRedis("xuanji:gift_boxes*")
	return b, nil
}

func (s *DataStore) DeleteGiftBox(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, b := range s.GiftBoxes {
		if b.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("未找到指定礼盒")
	}

	s.GiftBoxes = append(s.GiftBoxes[:idx], s.GiftBoxes[idx+1:]...)
	_ = s.saveUnlocked()

	if s.db != nil {
		_, _ = s.db.Exec("DELETE FROM gift_boxes WHERE id=$1", id)
	}

	s.invalidateRedis("xuanji:gift_boxes*")
	return nil
}

func (s *DataStore) ToggleGiftBoxStatus(id string) (*model.GiftBox, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.GiftBoxes {
		if s.GiftBoxes[i].ID == id {
			if s.GiftBoxes[i].Status == "已启用" {
				s.GiftBoxes[i].Status = "已下架"
			} else {
				s.GiftBoxes[i].Status = "已启用"
			}
			s.GiftBoxes[i].UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
			_ = s.saveUnlocked()

			if s.db != nil {
				_, _ = s.db.Exec("UPDATE gift_boxes SET status=$1, updated_at=$2 WHERE id=$3",
					s.GiftBoxes[i].Status, s.GiftBoxes[i].UpdatedAt, id)
			}
			s.invalidateRedis("xuanji:gift_boxes*")
			c := s.GiftBoxes[i]
			return &c, nil
		}
	}
	return nil, fmt.Errorf("礼盒未找到")
}

func (s *DataStore) SimulateOpenBox(id string, req model.SimulateOpenRequest) (*model.SimulateOpenResponse, error) {
	s.mu.RLock()
	var targetBox *model.GiftBox
	for _, b := range s.GiftBoxes {
		if b.ID == id {
			c := b
			targetBox = &c
			break
		}
	}
	s.mu.RUnlock()

	if targetBox == nil {
		return nil, fmt.Errorf("礼盒不存在")
	}

	resp := &model.SimulateOpenResponse{
		BoxID:      targetBox.ID,
		BoxName:    targetBox.Name,
		BoxType:    targetBox.BoxType,
		MaxChoices: targetBox.MaxChoices,
		Candidates: targetBox.Items,
	}

	switch targetBox.BoxType {
	case model.BoxTypeFixed:
		resp.WonItems = targetBox.Items
		resp.Message = fmt.Sprintf("开启普通固定礼匣，获得全部 %d 种专属配置物资！", len(targetBox.Items))

	case model.BoxTypeRandomProb:
		if len(targetBox.Items) == 0 {
			return nil, fmt.Errorf("礼盒内无物品配置")
		}
		totalProb := 0.0
		for _, item := range targetBox.Items {
			totalProb += item.Probability
		}
		if totalProb <= 0 {
			totalProb = float64(len(targetBox.Items))
			for i := range targetBox.Items {
				targetBox.Items[i].Probability = 1.0
			}
		}

		roll := rand.Float64() * totalProb
		cum := 0.0
		wonIdx := 0
		for i, item := range targetBox.Items {
			cum += item.Probability
			if roll <= cum {
				wonIdx = i
				break
			}
		}
		wonItem := targetBox.Items[wonIdx]
		resp.WonItems = []model.GiftBoxItem{wonItem}
		resp.RolledIndex = wonIdx
		resp.Message = fmt.Sprintf("太虚机缘天命所归！掷骰命中概率 [%.1f%%]，恭喜开出「%s」x%d！", wonItem.Probability, wonItem.ItemName, wonItem.Amount)

	case model.BoxTypeSingleChoice:
		if len(req.ChosenItems) == 0 {
			resp.WonItems = []model.GiftBoxItem{}
			resp.Message = "单选自选礼匣已激活，请从候选中挑选 1 项心仪宝物！"
		} else {
			chosenName := req.ChosenItems[0]
			var chosenItem *model.GiftBoxItem
			for _, it := range targetBox.Items {
				if it.ItemName == chosenName {
					c := it
					chosenItem = &c
					break
				}
			}
			if chosenItem == nil && len(targetBox.Items) > 0 {
				chosenItem = &targetBox.Items[0]
			}
			if chosenItem != nil {
				resp.WonItems = []model.GiftBoxItem{*chosenItem}
				resp.Message = fmt.Sprintf("自选定夺！成功认领「%s」x%d！", chosenItem.ItemName, chosenItem.Amount)
			}
		}

	case model.BoxTypeMultiChoice:
		limit := targetBox.MaxChoices
		if limit < 1 {
			limit = 1
		}
		if len(req.ChosenItems) == 0 {
			resp.WonItems = []model.GiftBoxItem{}
			resp.Message = fmt.Sprintf("多选自选礼匣已激活，可自主勾选至多 %d 项道具！", limit)
		} else {
			var wonList []model.GiftBoxItem
			chosenSet := make(map[string]bool)
			for _, c := range req.ChosenItems {
				if len(wonList) >= limit {
					break
				}
				if chosenSet[c] {
					continue
				}
				chosenSet[c] = true
				for _, it := range targetBox.Items {
					if it.ItemName == c {
						wonList = append(wonList, it)
						break
					}
				}
			}
			resp.WonItems = wonList
			resp.Message = fmt.Sprintf("自选多项认领成功！共获得 %d 种心仪宗门秘藏！", len(wonList))
		}
	}

	return resp, nil
}

func (s *DataStore) DispatchGiftBox(id string, req model.DispatchBoxRequest) (*model.GMLog, error) {
	box, err := s.GetGiftBox(id)
	if err != nil {
		return nil, err
	}
	if req.PlayerID == "" {
		return nil, fmt.Errorf("玩家ID不能为空")
	}
	amount := req.Amount
	if amount <= 0 {
		amount = 1
	}
	reason := req.Reason
	if reason == "" {
		reason = "GM定制礼盒投放"
	}

	typeDesc := "普通固定"
	switch box.BoxType {
	case model.BoxTypeRandomProb:
		typeDesc = "随机概率盲盒"
	case model.BoxTypeSingleChoice:
		typeDesc = "单选自选"
	case model.BoxTypeMultiChoice:
		typeDesc = fmt.Sprintf("多选自选(%d选%d)", len(box.Items), box.MaxChoices)
	}

	logEntry := model.GMLog{
		ID:       fmt.Sprintf("GM%d", time.Now().UnixNano()%1000000),
		Operator: "林管理员",
		Action:   "发放定制礼盒",
		Target:   fmt.Sprintf("%s · %s", box.Game, req.PlayerID),
		Detail:   fmt.Sprintf("向玩家发放定制礼匣 [%s] x%d (类型: %s)，原因: %s", box.Name, amount, typeDesc, reason),
		Time:     time.Now().Format("2006-01-02 15:04:05"),
		Status:   "成功",
	}

	s.mu.Lock()
	s.GMLogs = append([]model.GMLog{logEntry}, s.GMLogs...)
	_ = s.saveUnlocked()
	s.mu.Unlock()

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			logEntry.ID, logEntry.Operator, logEntry.Action, logEntry.Target, logEntry.Detail, logEntry.Time, logEntry.Status)
	}

	return &logEntry, nil
}
