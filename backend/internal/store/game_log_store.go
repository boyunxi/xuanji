package store

import (
	"strings"

	"xuanji-backend/internal/model"
)

// GetGameLogs returns game logs matching optional filters
func (s *DataStore) GetGameLogs(game, category, playerID, level, keyword string) []model.GameLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.GameLog
	kw := strings.ToLower(strings.TrimSpace(keyword))

	for _, l := range s.GameLogs {
		if game != "" && game != "all" && game != "全部游戏" && l.Game != game {
			continue
		}
		if category != "" && category != "all" && category != "全部" && l.Category != category {
			continue
		}
		if playerID != "" && l.PlayerID != playerID {
			continue
		}
		if level != "" && level != "all" && level != "全部" && l.Level != level {
			continue
		}
		if kw != "" {
			match := strings.Contains(strings.ToLower(l.ID), kw) ||
				strings.Contains(strings.ToLower(l.PlayerName), kw) ||
				strings.Contains(strings.ToLower(l.PlayerID), kw) ||
				strings.Contains(strings.ToLower(l.Action), kw) ||
				strings.Contains(strings.ToLower(l.Detail), kw) ||
				strings.Contains(strings.ToLower(l.ServerID), kw) ||
				strings.Contains(strings.ToLower(l.Delta), kw)
			if !match {
				continue
			}
		}
		result = append(result, l)
	}

	return result
}

// AddGameLog records an in-game log entry and persists to DB
func (s *DataStore) AddGameLog(log model.GameLog) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.GameLogs = append([]model.GameLog{log}, s.GameLogs...)

	if s.db != nil {
		_, _ = s.db.Exec(`INSERT INTO game_logs (id, game, server_id, player_id, player_name, category, action, detail, delta, ip, level, time)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			log.ID, log.Game, log.ServerID, log.PlayerID, log.PlayerName, log.Category, log.Action, log.Detail, log.Delta, log.IP, log.Level, log.Time)
	}

	return nil
}
