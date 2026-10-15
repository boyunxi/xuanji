package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

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
			{ID: "all", Name: "全部游戏", DisplayOrder: 0},
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

	var res []model.Player
	q := strings.ToLower(strings.TrimSpace(query))
	for _, p := range s.Players {
		if game != "" && game != "全部游戏" && p.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && p.Status != status {
			continue
		}
		if q != "" {
			nameMatch := strings.Contains(strings.ToLower(p.Name), q)
			idMatch := strings.Contains(strings.ToLower(p.ID), q)
			if !nameMatch && !idMatch {
				continue
			}
		}
		res = append(res, p)
	}
	return res
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
			return &copy, nil
		}
	}
	return nil, fmt.Errorf("player not found: %s", id)
}
