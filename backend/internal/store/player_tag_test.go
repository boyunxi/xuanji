package store_test

import (
	"os"
	"testing"
	"xuanji-backend/internal/store"
)

func TestPlayerTagsAndRemark(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "xuanji_player_tag_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	// 1. 获取玩家列表，验证有标签的玩家排在最上面
	players := ds.GetPlayers("全部区服", "全部状态", "")
	if len(players) < 3 {
		t.Fatalf("expected at least 3 players, got %d", len(players))
	}

	// 第一位玩家必须拥有标签
	if len(players[0].Tags) == 0 {
		t.Errorf("expected first player to have tags (pinned to top), but got 0 tags")
	}

	// 2. 为一个原本没有标签的玩家打上标签
	targetID := "XJ100367" // 青山客
	updated, err := ds.UpdatePlayerTagsAndRemark(targetID, []string{"新晋大R", "修仙狂人"}, "本周连续充值多笔，重点跟进")
	if err != nil {
		t.Fatalf("failed to update player tags and remark: %v", err)
	}
	if len(updated.Tags) != 2 || updated.Remark != "本周连续充值多笔，重点跟进" {
		t.Fatalf("unexpected tags or remark in updated player")
	}

	// 3. 再次获取列表，青山客因为被打上了标签，必须自动排在前排（置顶）
	playersAfter := ds.GetPlayers("", "", "")
	foundInTop := false
	for i := 0; i < 4 && i < len(playersAfter); i++ {
		if playersAfter[i].ID == targetID && len(playersAfter[i].Tags) > 0 {
			foundInTop = true
			break
		}
	}
	if !foundInTop {
		t.Errorf("expected tagged player %s to be pinned in the top rows", targetID)
	}
}
