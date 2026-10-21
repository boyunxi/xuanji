package store

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"xuanji-backend/internal/model"
)

func setupTestStore(t *testing.T) *DataStore {
	t.Helper()
	tmpDir := t.TempDir()
	store, err := NewDataStore(tmpDir)
	if err != nil {
		t.Fatalf("failed to create data store: %v", err)
	}
	return store
}

func TestCDKey_UniversalFlow(t *testing.T) {
	s := setupTestStore(t)

	testCode := fmt.Sprintf("SP_%d", time.Now().UnixNano()%1000000)

	// 1. Create a universal CDKey batch
	batch, err := s.CreateCDKeyBatch(model.CreateCDKeyBatchRequest{
		Name:       "春季测试全员礼包",
		Type:       model.CDKeyTypeUniversal,
		Code:       testCode,
		Game:       "全部游戏",
		MinLevel:   10,
		ExpireDays: 7,
		Rewards: []model.CDKeyReward{
			{ItemID: "ITEM_101", ItemName: "元宝", Amount: 888},
		},
		Description: "测试通用码",
	})
	if err != nil {
		t.Fatalf("failed to create universal batch: %v", err)
	}
	if batch.Code != testCode {
		t.Errorf("expected code %s, got %s", testCode, batch.Code)
	}

	// 2. Try to create duplicate universal code
	_, err = s.CreateCDKeyBatch(model.CreateCDKeyBatchRequest{
		Name:     "重复礼包",
		Type:     model.CDKeyTypeUniversal,
		Code:     strings.ToLower(testCode), // case insensitive check
		Rewards:  []model.CDKeyReward{{ItemID: "ITEM_101", Amount: 100}},
	})
	if err == nil {
		t.Fatalf("expected error creating duplicate universal code, got nil")
	}

	// 3. Redeem with under-leveled player (Level 5 < 10)
	s.Players = append(s.Players, model.Player{
		ID:     "TEST_NOOB",
		Name:   "修真小萌新",
		Game:   "山海长歌",
		Level:  5,
		Status: "正常",
	})
	_, err = s.RedeemCDKey(model.RedeemCDKeyRequest{
		Code:     testCode,
		PlayerID: "TEST_NOOB",
	})
	if err == nil || !strings.Contains(err.Error(), "角色等级未达到领奖条件") {
		t.Fatalf("expected level requirement error, got: %v", err)
	}

	// 4. Redeem with eligible player
	s.Players = append(s.Players, model.Player{
		ID:     "TEST_HERO",
		Name:   "逍遥剑仙",
		Game:   "山海长歌",
		Level:  50,
		Status: "正常",
	})
	res, err := s.RedeemCDKey(model.RedeemCDKeyRequest{
		Code:     testCode,
		PlayerID: "TEST_HERO",
	})
	if err != nil {
		t.Fatalf("expected successful redemption, got: %v", err)
	}
	if !res.Success || len(res.Rewards) != 1 || res.Rewards[0].Amount != 888 {
		t.Fatalf("invalid redemption response: %+v", res)
	}

	// 5. Repeat redemption should fail
	_, err = s.RedeemCDKey(model.RedeemCDKeyRequest{
		Code:     testCode,
		PlayerID: "TEST_HERO",
	})
	if err == nil || !strings.Contains(err.Error(), "不可重复领取") {
		t.Fatalf("expected duplicate redemption prevention error, got: %v", err)
	}
}

func TestCDKey_UniqueFlow(t *testing.T) {
	s := setupTestStore(t)

	s.Players = append(s.Players, model.Player{
		ID:     "TEST_UNIQUE_PLAYER",
		Name:   "太极道人",
		Game:   "九州志",
		Level:  20,
		Status: "正常",
	})

	// 1. Create a unique card keys batch (10 cards)
	batch, err := s.CreateCDKeyBatch(model.CreateCDKeyBatchRequest{
		Name:       "测试独占激活码",
		Type:       model.CDKeyTypeUnique,
		Prefix:     "TEST-",
		Quantity:   10,
		Game:       "九州志",
		MinLevel:   1,
		ExpireDays: 15,
		Rewards: []model.CDKeyReward{
			{ItemID: "ITEM_401", ItemName: "太虚飞剑", Amount: 1},
		},
	})
	if err != nil {
		t.Fatalf("failed to create unique batch: %v", err)
	}
	if batch.TotalCount != 10 {
		t.Errorf("expected 10 items, got %d", batch.TotalCount)
	}

	items := s.GetCDKeyItems(batch.ID, "", "")
	if len(items) != 10 {
		t.Fatalf("expected 10 items retrieved, got %d", len(items))
	}

	codeToRedeem := items[0].Code
	if !strings.HasPrefix(codeToRedeem, "TEST-") {
		t.Errorf("expected prefix TEST-, got code: %s", codeToRedeem)
	}

	// 2. Redeem first card
	res, err := s.RedeemCDKey(model.RedeemCDKeyRequest{
		Code:     codeToRedeem,
		PlayerID: "TEST_UNIQUE_PLAYER",
	})
	if err != nil {
		t.Fatalf("failed to redeem unique card key: %v", err)
	}
	if !res.Success {
		t.Fatalf("redemption unsuccessful: %+v", res)
	}

	// 3. Trying to redeem same card again must fail
	_, err = s.RedeemCDKey(model.RedeemCDKeyRequest{
		Code:     codeToRedeem,
		PlayerID: "TEST_UNIQUE_PLAYER",
	})
	if err == nil || !strings.Contains(err.Error(), "被使用") {
		t.Fatalf("expected card already used error, got: %v", err)
	}

	// 4. Test CSV Export
	csvContent, err := s.ExportCDKeyItemsCSV(batch.ID)
	if err != nil {
		t.Fatalf("failed to export CSV: %v", err)
	}
	if !strings.Contains(csvContent, "兑换码,批次ID,批次名称") || !strings.Contains(csvContent, codeToRedeem) {
		t.Fatalf("CSV content missing expected headers or code: %s", csvContent)
	}
}
