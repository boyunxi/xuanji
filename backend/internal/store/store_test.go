package store_test

import (
	"os"
	"testing"
	"xuanji-backend/internal/store"
)

func TestDataStoreCRUD(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "xuanji_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	// 1. Test Player
	players := ds.GetPlayers("全部游戏", "全部状态", "")
	if len(players) == 0 {
		t.Errorf("expected seeded players, got 0")
	}

	playerID := players[0].ID
	origStatus := players[0].Status
	newStatus := "已封禁"
	if origStatus == "已封禁" {
		newStatus = "正常"
	}
	updatedPlayer, err := ds.UpdatePlayerStatus(playerID, newStatus)
	if err != nil {
		t.Fatalf("failed to update player status: %v", err)
	}
	if updatedPlayer.Status != newStatus {
		t.Errorf("expected status %s, got %s", newStatus, updatedPlayer.Status)
	}

	// 2. Test Event
	ev, err := ds.CreateEvent("测试秘境活动", "山海长歌", "2026-10-25")
	if err != nil {
		t.Fatalf("failed to create event: %v", err)
	}
	if ev.Title != "测试秘境活动" || ev.Status != "未开始" {
		t.Errorf("unexpected event: %+v", ev)
	}

	evUpdated, err := ds.UpdateEventStatus(ev.ID, "进行中")
	if err != nil {
		t.Fatalf("failed to update event status: %v", err)
	}
	if evUpdated.Status != "进行中" {
		t.Errorf("expected event status 进行中, got %s", evUpdated.Status)
	}

	// 3. Test Announcement
	ann, err := ds.CreateAnnouncement("维护更新测试", "九州志", "测试正文内容")
	if err != nil {
		t.Fatalf("failed to create announcement: %v", err)
	}
	annUpdated, err := ds.UpdateAnnouncementStatus(ann.ID, "已发布")
	if err != nil {
		t.Fatalf("failed to update announcement status: %v", err)
	}
	if annUpdated.Status != "已发布" {
		t.Errorf("expected announcement status 已发布, got %s", annUpdated.Status)
	}

	err = ds.DeleteAnnouncement(ann.ID)
	if err != nil {
		t.Fatalf("failed to delete announcement: %v", err)
	}

	// 4. Test Orders
	orders := ds.GetOrders("全部游戏", "全部状态", "")
	if len(orders) == 0 {
		t.Errorf("expected seeded orders, got 0")
	}
	orderID := orders[0].ID
	orderUpdated, err := ds.UpdateOrderStatus(orderID, "已退款")
	if err != nil {
		t.Fatalf("failed to update order status: %v", err)
	}
	if orderUpdated.Status != "已退款" {
		t.Errorf("expected status 已退款, got %s", orderUpdated.Status)
	}

	// 5. Test Overview
	overview := ds.GetOverview("全部游戏", "week")
	if len(overview.Metrics) != 4 {
		t.Errorf("expected 4 metrics, got %d", len(overview.Metrics))
	}
	if len(overview.Trend.Values) != 7 {
		t.Errorf("expected 7 trend values, got %d", len(overview.Trend.Values))
	}
	if len(overview.RevenueParts) != 3 {
		t.Errorf("expected 3 revenue parts, got %d", len(overview.RevenueParts))
	}

	// 6. Test Search
	searchResults := ds.Search("测试秘境")
	if len(searchResults) == 0 {
		t.Errorf("expected search result for '测试秘境'")
	}
}
