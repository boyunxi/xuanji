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

// GetMails returns mails filtered by game, status, and query keyword
func (s *DataStore) GetMails(game, status, query string) []model.Mail {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.Mail
	qLower := strings.ToLower(strings.TrimSpace(query))

	for _, m := range s.Mails {
		if game != "" && game != "全部游戏" && m.Game != "全部游戏" && m.Game != game {
			continue
		}
		if status != "" && status != "全部状态" && m.Status != status {
			continue
		}
		if qLower != "" {
			matchTitle := strings.Contains(strings.ToLower(m.Title), qLower)
			matchContent := strings.Contains(strings.ToLower(m.Content), qLower)
			matchTarget := strings.Contains(strings.ToLower(m.TargetID), qLower)
			matchSender := strings.Contains(strings.ToLower(m.Sender), qLower)
			if !matchTitle && !matchContent && !matchTarget && !matchSender {
				continue
			}
		}
		result = append(result, m)
	}
	return result
}

// GetMailByID retrieves a single mail by ID
func (s *DataStore) GetMailByID(id string) (*model.Mail, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, m := range s.Mails {
		if m.ID == id {
			copyMail := m
			return &copyMail, nil
		}
	}
	return nil, fmt.Errorf("邮件未找到: %s", id)
}

// CreateMail drafts or dispatches a new in-game mail
func (s *DataStore) CreateMail(req model.CreateMailRequest) (*model.Mail, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if strings.TrimSpace(req.Title) == "" {
		return nil, fmt.Errorf("邮件标题不能为空")
	}
	if strings.TrimSpace(req.Content) == "" {
		return nil, fmt.Errorf("邮件正文不能为空")
	}

	expireDays := req.ExpireDays
	if expireDays <= 0 {
		expireDays = 7
	}

	now := time.Now()
	nowStr := now.Format("2006-01-02 15:04:05")
	expStr := now.AddDate(0, 0, expireDays).Format("2006-01-02 15:04:05")

	id := fmt.Sprintf("MAIL_%s_%04d", now.Format("20060102150405"), len(s.Mails)+1)

	status := "已发送"
	if req.IsDraft {
		status = "草稿"
	}

	sender := strings.TrimSpace(req.Sender)
	if sender == "" {
		sender = "璇玑运营司"
	}

	game := req.Game
	if game == "" {
		game = "全部游戏"
	}

	targetType := req.TargetType
	if targetType == "" {
		targetType = "all"
	}

	targetID := strings.TrimSpace(req.TargetID)
	if targetType == "all" || targetID == "" {
		targetID = "ALL"
	}

	totalTarget := 1
	if targetType == "all" {
		totalTarget = 25000
		if game != "全部游戏" {
			totalTarget = 8800
		}
	}

	mail := model.Mail{
		ID:           id,
		Title:        strings.TrimSpace(req.Title),
		Content:      strings.TrimSpace(req.Content),
		Sender:       sender,
		Game:         game,
		TargetType:   targetType,
		TargetID:     targetID,
		MinLevel:     req.MinLevel,
		Status:       status,
		Attachments:  req.Attachments,
		SentAt:       nowStr,
		ExpiresAt:    expStr,
		ClaimedCount: 0,
		TotalTarget:  totalTarget,
	}

	// 1. Memory
	s.Mails = append([]model.Mail{mail}, s.Mails...)

	// 2. PostgreSQL
	if s.db != nil {
		attachBytes, _ := json.Marshal(mail.Attachments)
		_, _ = s.db.Exec(`INSERT INTO mails (id, title, content, sender, game, target_type, target_id, min_level, status, attachments, sent_at, expires_at, claimed_count, total_target)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
			mail.ID, mail.Title, mail.Content, mail.Sender, mail.Game, mail.TargetType, mail.TargetID, mail.MinLevel, mail.Status, string(attachBytes), mail.SentAt, mail.ExpiresAt, mail.ClaimedCount, mail.TotalTarget)
	}

	// 3. Local JSON
	_ = s.saveUnlocked()

	// 4. Redis cache invalidation
	s.invalidateRedis("mails:*", "overview:*")

	// 5. Dispatch to game server via driver if active send
	if !req.IsDraft && s.driver != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, _ = s.driver.DispatchMail(ctx, gameserver.MailPayload{
			RequestID:   fmt.Sprintf("REQ_MAIL_%d", time.Now().UnixNano()),
			Game:        mail.Game,
			MailID:      mail.ID,
			Title:       mail.Title,
			Content:     mail.Content,
			TargetType:  mail.TargetType,
			TargetID:    mail.TargetID,
			MinLevel:    mail.MinLevel,
			Attachments: mail.Attachments,
		})
		cancel()
	}

	return &mail, nil
}

// RecallMail recalls a dispatched mail so it can no longer be claimed
func (s *DataStore) RecallMail(id string) (*model.Mail, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var target *model.Mail
	for i := range s.Mails {
		if s.Mails[i].ID == id {
			if s.Mails[i].Status != "已发送" {
				return nil, fmt.Errorf("该邮件当前状态为[%s]，无法执行撤回操作", s.Mails[i].Status)
			}
			s.Mails[i].Status = "已撤回"
			target = &s.Mails[i]
			break
		}
	}

	if target == nil {
		return nil, fmt.Errorf("未找到待撤回邮件: %s", id)
	}

	if s.db != nil {
		_, _ = s.db.Exec("UPDATE mails SET status = '已撤回' WHERE id = $1", id)
	}

	_ = s.saveUnlocked()
	s.invalidateRedis("mails:*", "overview:*")

	return target, nil
}

// DeleteMail removes a mail draft or recalled mail
func (s *DataStore) DeleteMail(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	found := false
	var updated []model.Mail
	for _, m := range s.Mails {
		if m.ID == id {
			found = true
			continue
		}
		updated = append(updated, m)
	}

	if !found {
		return fmt.Errorf("未找到待删除邮件: %s", id)
	}

	s.Mails = updated

	if s.db != nil {
		_, _ = s.db.Exec("DELETE FROM mails WHERE id = $1", id)
	}

	_ = s.saveUnlocked()
	s.invalidateRedis("mails:*", "overview:*")

	return nil
}
