package store_test

import (
	"os"
	"testing"
	"xuanji-backend/internal/model"
	"xuanji-backend/internal/store"
)

func TestGameLogs(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "xuanji_gamelog_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	// Test default logs seeded
	logs := ds.GetGameLogs("", "", "", "", "")
	if len(logs) == 0 {
		t.Fatalf("expected seeded game logs, got 0")
	}

	// Test filter by game
	shLogs := ds.GetGameLogs("山海长歌", "", "", "", "")
	for _, l := range shLogs {
		if l.Game != "山海长歌" {
			t.Errorf("expected game 山海长歌, got %s", l.Game)
		}
	}

	// Test filter by category
	econLogs := ds.GetGameLogs("", "经济流水", "", "", "")
	for _, l := range econLogs {
		if l.Category != "经济流水" {
			t.Errorf("expected category 经济流水, got %s", l.Category)
		}
	}

	// Test add game log
	newLog := model.GameLog{
		ID:         "GL_TEST_999",
		Game:       "云间录",
		ServerID:   "太虚幻境-1服",
		PlayerID:   "XJ100999",
		PlayerName: "测试仙友",
		Category:   "玩法战斗",
		Action:     "通关秘境",
		Detail:     "首通测试副本",
		Delta:      "+500 灵石",
		IP:         "127.0.0.1",
		Level:      "INFO",
		Time:       "2026-10-21 23:00:00",
	}
	if err := ds.AddGameLog(newLog); err != nil {
		t.Fatalf("failed to add game log: %v", err)
	}

	matched := ds.GetGameLogs("", "", "XJ100999", "", "")
	if len(matched) == 0 || matched[0].ID != "GL_TEST_999" {
		t.Errorf("expected to find added log GL_TEST_999")
	}
}
