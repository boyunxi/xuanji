package store_test

import (
	"os"
	"testing"

	"xuanji-backend/internal/model"
	"xuanji-backend/internal/store"
)

func TestMailStore(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "xuanji_mail_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	// 1. Initial seeded mails
	mails := ds.GetMails("全部游戏", "全部状态", "")
	if len(mails) < 3 {
		t.Fatalf("expected at least 3 seeded mails, got %d", len(mails))
	}

	// 2. Create a new mail
	req := model.CreateMailRequest{
		Title:      "测试邮件补偿",
		Content:    "道友请查收测试补偿物品",
		Sender:     "测试运营部",
		Game:       "山海长歌",
		TargetType: "all",
		ExpireDays: 5,
		Attachments: []model.MailAttachment{
			{ItemID: "ITEM_101", ItemName: "元宝", Category: "通用货币", Amount: 888, Rarity: "传说", IsBox: false},
		},
		IsDraft: false,
	}

	mail, err := ds.CreateMail(req)
	if err != nil {
		t.Fatalf("failed to create mail: %v", err)
	}
	if mail.Status != "已发送" {
		t.Errorf("expected status 已发送, got %s", mail.Status)
	}
	if len(mail.Attachments) != 1 || mail.Attachments[0].Amount != 888 {
		t.Errorf("unexpected attachments: %+v", mail.Attachments)
	}

	// 3. Get by ID
	fetched, err := ds.GetMailByID(mail.ID)
	if err != nil || fetched.Title != "测试邮件补偿" {
		t.Fatalf("failed to fetch mail by ID: %v", err)
	}

	// 4. Recall mail
	recalled, err := ds.RecallMail(mail.ID)
	if err != nil {
		t.Fatalf("failed to recall mail: %v", err)
	}
	if recalled.Status != "已撤回" {
		t.Errorf("expected status 已撤回, got %s", recalled.Status)
	}

	// 5. Delete mail
	err = ds.DeleteMail(mail.ID)
	if err != nil {
		t.Fatalf("failed to delete mail: %v", err)
	}

	_, err = ds.GetMailByID(mail.ID)
	if err == nil {
		t.Fatal("expected error getting deleted mail, got nil")
	}
}
