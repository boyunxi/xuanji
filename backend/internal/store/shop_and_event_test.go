package store_test

import (
	"os"
	"testing"
	"xuanji-backend/internal/model"
	"xuanji-backend/internal/store"
)

func TestShopAndEventFlow(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "xuanji_shop_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	// 1. Test Event Refined Controls
	ev, err := ds.CreateEvent("九洲问剑天梯赛", "九州志", "2026-10-25")
	if err != nil {
		t.Fatalf("failed to create event: %v", err)
	}

	// Update dates
	updatedEv, err := ds.UpdateEvent(ev.ID, "九洲问剑巅峰赛(更名)", "九州志", "2026-10-26", "2026-11-05", "进行中")
	if err != nil || updatedEv.Start != "2026-10-26" || updatedEv.Status != "进行中" {
		t.Fatalf("failed to update event: %v", err)
	}

	// Toggle status
	toggledEv, err := ds.ToggleEventStatus(ev.ID)
	if err != nil || toggledEv.Status != "已暂停" {
		t.Fatalf("expected status 已暂停, got %v", toggledEv.Status)
	}

	// Reset event data
	resetDataEv, err := ds.ResetEventData(ev.ID)
	if err != nil || resetDataEv.Participants != 0 {
		t.Fatalf("expected 0 participants after data reset")
	}

	// Reset event cycle
	resetEv, err := ds.ResetEvent(ev.ID)
	if err != nil || resetEv.Status != "未开始" {
		t.Fatalf("expected status 未开始 after reset")
	}

	// 2. Test Shop Items
	shopItems := ds.GetShopItems("", "", "", "")
	if len(shopItems) == 0 {
		t.Fatalf("expected seeded shop items, got 0")
	}

	// Create new shop item
	newItem, err := ds.CreateShopItem(model.ShopItem{
		Name:          "测试飞升自选包",
		Game:          "山海长歌",
		Category:      "超值礼包",
		Currency:      "仙玉",
		Price:         88,
		OriginalPrice: 168,
		Stock:         100,
		BuyLimit:      "每日限购1次",
		Tag:           "限时上架",
		Description:   "自选仙药与炼器精铁",
		Items:         "洗髓丹 x10, 寒铁 x20",
		Status:        "上架中",
	})
	if err != nil {
		t.Fatalf("failed to create shop item: %v", err)
	}

	// Toggle status
	toggledItem, err := ds.ToggleShopItemStatus(newItem.ID)
	if err != nil || toggledItem.Status != "已下架" {
		t.Fatalf("expected status 已下架, got %s", toggledItem.Status)
	}

	// Update item
	updatedItem, err := ds.UpdateShopItem(newItem.ID, model.ShopItem{
		Name:  "测试飞升自选包(改)",
		Price: 99,
	})
	if err != nil || updatedItem.Price != 99 {
		t.Fatalf("expected price 99, got %v", updatedItem.Price)
	}

	// Delete item
	if err := ds.DeleteShopItem(newItem.ID); err != nil {
		t.Fatalf("failed to delete shop item: %v", err)
	}
}
