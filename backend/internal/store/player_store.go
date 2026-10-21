package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"xuanji-backend/internal/gameserver"
	"xuanji-backend/internal/model"
)

// --- Games ---

func (s *DataStore) GetGames() []model.GameInfo {
	if s.rdb != nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if cached, err := s.rdb.Get(ctx, "xuanji:games").Result(); err == nil {
			var list []model.GameInfo
			if err := json.Unmarshal([]byte(cached), &list); err == nil && len(list) > 0 {
				return list
			}
		}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	res := s.Games
	if len(res) == 0 {
		res = []model.GameInfo{
			{ID: "all", Name: "全部区服", DisplayOrder: 0},
			{ID: "shanhai", Name: "山海长歌", DisplayOrder: 1},
			{ID: "jiuzhou", Name: "九州志", DisplayOrder: 2},
			{ID: "yunjian", Name: "云间录", DisplayOrder: 3},
		}
	}

	if s.rdb != nil && len(res) > 0 {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		data, _ := json.Marshal(res)
		_ = s.rdb.Set(ctx, "xuanji:games", string(data), 5*time.Minute).Err()
	}

	return res
}

// --- Players ---

func (s *DataStore) GetPlayers(game, status, query string) []model.Player {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var tagged []model.Player
	var untagged []model.Player
	q := strings.ToLower(strings.TrimSpace(query))

	for _, p := range s.Players {
		if !model.IsAllGames(game) && p.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && p.Status != status {
			continue
		}
		if q != "" {
			nameMatch := strings.Contains(strings.ToLower(p.Name), q)
			idMatch := strings.Contains(strings.ToLower(p.ID), q)
			remarkMatch := strings.Contains(strings.ToLower(p.Remark), q)
			tagMatch := false
			for _, t := range p.Tags {
				if strings.Contains(strings.ToLower(t), q) {
					tagMatch = true
					break
				}
			}
			if !nameMatch && !idMatch && !remarkMatch && !tagMatch {
				continue
			}
		}

		// 带有标签的玩家自动排在最上一行（置顶）
		if len(p.Tags) > 0 {
			tagged = append(tagged, p)
		} else {
			untagged = append(untagged, p)
		}
	}

	return append(tagged, untagged...)
}

func (s *DataStore) GetPlayer(id string) (*model.Player, bool) {
	return s.GetPlayerByID(id)
}

func (s *DataStore) GetPlayerByID(id string) (*model.Player, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, p := range s.Players {
		if p.ID == id {
			copy := p
			return &copy, true
		}
	}
	return nil, false
}

func (s *DataStore) UpdatePlayerStatus(id string, status string) (*model.Player, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Players {
		if s.Players[i].ID == id {
			s.Players[i].Status = status
			if err := s.saveUnlocked(); err != nil {
				return nil, err
			}
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE players SET status=$1 WHERE id=$2", status, id)
			}
			s.invalidateRedis("xuanji:overview:*")
			copy := s.Players[i]

			if s.driver != nil {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				_, _ = s.driver.SetPlayerStatus(ctx, gameserver.PlayerStatusPayload{
					RequestID: fmt.Sprintf("REQ_STATUS_%d", time.Now().UnixNano()),
					Game:      copy.Game,
					PlayerID:  copy.ID,
					Status:    status,
					Reason:    "运营后台更新玩家状态",
				})
				cancel()
			}

			return &copy, nil
		}
	}
	return nil, fmt.Errorf("player not found: %s", id)
}

// UpdatePlayerTagsAndRemark updates player's tags and operation remarks
func (s *DataStore) UpdatePlayerTagsAndRemark(id string, tags []string, remark string) (*model.Player, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Players {
		if s.Players[i].ID == id {
			s.Players[i].Tags = tags
			s.Players[i].Remark = remark
			_ = s.saveUnlocked()

			if s.db != nil {
				tagsStr := strings.Join(tags, ",")
				_, _ = s.db.Exec("UPDATE players SET tags=$1, remark=$2 WHERE id=$3", tagsStr, remark, id)
			}

			copy := s.Players[i]
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("player not found: %s", id)
}
