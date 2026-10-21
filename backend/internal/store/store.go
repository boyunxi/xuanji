package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"xuanji-backend/internal/gameserver"
	"xuanji-backend/internal/model"
)

type DataStore struct {
	mu            sync.RWMutex
	filePath      string
	db            *sql.DB
	rdb           *redis.Client
	driver        gameserver.Driver
	Games         []model.GameInfo     `json:"games"`
	Players       []model.Player       `json:"players"`
	Events        []model.Event        `json:"events"`
	Announcements []model.Announcement `json:"announcements"`
	Orders        []model.Order        `json:"orders"`
	Notices       []model.Notice       `json:"notices"`
	Settings      model.Settings       `json:"settings"`
	GMLogs        []model.GMLog        `json:"gmLogs"`
	GameLogs      []model.GameLog      `json:"gameLogs"`
	ShopItems     []model.ShopItem     `json:"shopItems"`
	Items            []model.GameItem        `json:"items"`
	GiftBoxes        []model.GiftBox         `json:"giftBoxes"`
	Mails            []model.Mail            `json:"mails"`
	CDKeyBatches     []model.CDKeyBatch      `json:"cdkeyBatches"`
	CDKeyItems       []model.CDKeyItem       `json:"cdkeyItems"`
	CDKeyRedemptions []model.CDKeyRedemption `json:"cdkeyRedemptions"`
}

func NewDataStore(dataDir string) (*DataStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	filePath := filepath.Join(dataDir, "xuanji_data.json")
	store := &DataStore{
		filePath: filePath,
	}

	// Try reading existing data file as backup
	if data, err := os.ReadFile(filePath); err == nil && len(data) > 0 {
		_ = json.Unmarshal(data, store)
	}

	// If no existing file, initialize with default seed data
	if len(store.Players) == 0 {
		store.seedDefaultData()
		_ = store.saveUnlocked()
	}

	// Connect to native PostgreSQL
	if db, err := initPostgres(); err == nil {
		store.db = db
		log.Printf("[PostgreSQL] Connected to native database successfully.")
		if err := store.migrateAndSeedPG(db); err != nil {
			log.Printf("[PostgreSQL] Migrate warning: %v", err)
		}
		// Load persistent data from PG into memory
		store.reloadFromPG()
	} else {
		log.Printf("[PostgreSQL] Running without direct PG (%v), using local fallback.", err)
	}

	// Connect to native Redis
	if rdb, err := initRedis(); err == nil {
		store.rdb = rdb
		log.Printf("[Redis] Connected to native Redis server successfully at 127.0.0.1:6379.")
	} else {
		log.Printf("[Redis] Running without Redis cache (%v).", err)
	}

	// Initialize Game Server Driver
	store.driver = gameserver.NewDriver(store.rdb)

	return store, nil
}

func (s *DataStore) Driver() gameserver.Driver {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.driver
}

func (s *DataStore) SetDriver(d gameserver.Driver) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.driver = d
}

func (s *DataStore) reloadFromPG() {
	if s.db == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Games
	if rows, err := s.db.Query("SELECT id, name, display_order FROM games ORDER BY display_order ASC"); err == nil {
		var list []model.GameInfo
		for rows.Next() {
			var g model.GameInfo
			if err := rows.Scan(&g.ID, &g.Name, &g.DisplayOrder); err == nil {
				list = append(list, g)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Games = list
		}
	}

	// 2. Players
	if rows, err := s.db.Query("SELECT id, name, game, level, spend, last_active, status, tags, remark FROM players"); err == nil {
		var list []model.Player
		for rows.Next() {
			var p model.Player
			var tagsStr, remark sql.NullString
			if err := rows.Scan(&p.ID, &p.Name, &p.Game, &p.Level, &p.Spend, &p.LastActive, &p.Status, &tagsStr, &remark); err == nil {
				if strings.TrimSpace(tagsStr.String) != "" {
					p.Tags = strings.Split(tagsStr.String, ",")
				} else {
					p.Tags = []string{}
				}
				p.Remark = remark.String
				list = append(list, p)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Players = list
		}
	}

	// 3. Events
	if rows, err := s.db.Query("SELECT id, title, game, start_date, end_date, participants, status FROM events"); err == nil {
		var list []model.Event
		for rows.Next() {
			var e model.Event
			if err := rows.Scan(&e.ID, &e.Title, &e.Game, &e.Start, &e.End, &e.Participants, &e.Status); err == nil {
				list = append(list, e)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Events = list
		}
	}

	// 4. Announcements
	if rows, err := s.db.Query("SELECT id, title, game, date, content, status FROM announcements"); err == nil {
		var list []model.Announcement
		for rows.Next() {
			var a model.Announcement
			if err := rows.Scan(&a.ID, &a.Title, &a.Game, &a.Date, &a.Content, &a.Status); err == nil {
				list = append(list, a)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Announcements = list
		}
	}

	// 5. Orders
	if rows, err := s.db.Query("SELECT id, player, game, amount, method, time, status FROM orders"); err == nil {
		var list []model.Order
		for rows.Next() {
			var o model.Order
			if err := rows.Scan(&o.ID, &o.Player, &o.Game, &o.Amount, &o.Method, &o.Time, &o.Status); err == nil {
				list = append(list, o)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Orders = list
		}
	}

	// 6. Notices
	if rows, err := s.db.Query("SELECT id, title, time, page, read FROM notices ORDER BY id DESC"); err == nil {
		var list []model.Notice
		for rows.Next() {
			var n model.Notice
			if err := rows.Scan(&n.ID, &n.Title, &n.Time, &n.Page, &n.Read); err == nil {
				list = append(list, n)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Notices = list
		}
	}

	// 7. Settings
	var daily, orders, events bool
	if err := s.db.QueryRow("SELECT daily, orders, events FROM settings WHERE key='default'").Scan(&daily, &orders, &events); err == nil {
		s.Settings = model.Settings{Daily: daily, Orders: orders, Events: events}
	}

	// 8. GM Logs
	if rows, err := s.db.Query("SELECT id, operator, action, target, detail, time, status FROM gm_logs ORDER BY time DESC"); err == nil {
		var list []model.GMLog
		for rows.Next() {
			var l model.GMLog
			var detail sql.NullString
			if err := rows.Scan(&l.ID, &l.Operator, &l.Action, &l.Target, &detail, &l.Time, &l.Status); err == nil {
				l.Detail = detail.String
				list = append(list, l)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.GMLogs = list
		}
	}

	// 8.1 Game Logs
	if rows, err := s.db.Query("SELECT id, game, server_id, player_id, player_name, category, action, detail, delta, ip, level, time FROM game_logs ORDER BY time DESC"); err == nil {
		var list []model.GameLog
		for rows.Next() {
			var gl model.GameLog
			var detail, delta, ip, level sql.NullString
			if err := rows.Scan(&gl.ID, &gl.Game, &gl.ServerID, &gl.PlayerID, &gl.PlayerName, &gl.Category, &gl.Action, &detail, &delta, &ip, &level, &gl.Time); err == nil {
				gl.Detail = detail.String
				gl.Delta = delta.String
				gl.IP = ip.String
				gl.Level = level.String
				list = append(list, gl)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.GameLogs = list
		}
	}

	// 8.2 Shop Items
	if rows, err := s.db.Query("SELECT id, name, game, category, currency, price, original_price, stock, buy_limit, tag, description, items, status, sort_order, created_at, updated_at FROM shop_items ORDER BY sort_order ASC, created_at DESC"); err == nil {
		var list []model.ShopItem
		for rows.Next() {
			var si model.ShopItem
			var tag, desc, itms sql.NullString
			if err := rows.Scan(&si.ID, &si.Name, &si.Game, &si.Category, &si.Currency, &si.Price, &si.OriginalPrice, &si.Stock, &si.BuyLimit, &tag, &desc, &itms, &si.Status, &si.SortOrder, &si.CreatedAt, &si.UpdatedAt); err == nil {
				si.Tag = tag.String
				si.Description = desc.String
				si.Items = itms.String
				list = append(list, si)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.ShopItems = list
		}
	}

	// 9. Game Items
	if rows, err := s.db.Query("SELECT id, name, category, description, rarity, is_custom FROM game_items ORDER BY id ASC"); err == nil {
		var list []model.GameItem
		for rows.Next() {
			var it model.GameItem
			var desc, rarity sql.NullString
			if err := rows.Scan(&it.ID, &it.Name, &it.Category, &desc, &rarity, &it.IsCustom); err == nil {
				it.Description = desc.String
				it.Rarity = rarity.String
				list = append(list, it)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Items = list
		}
	}

	// 10. Gift Boxes
	if rows, err := s.db.Query("SELECT id, name, game, box_type, max_choices, rarity, icon, description, status, items, created_at, updated_at FROM gift_boxes ORDER BY created_at DESC"); err == nil {
		var list []model.GiftBox
		for rows.Next() {
			var b model.GiftBox
			var desc, icon sql.NullString
			var itemsJSON string
			if err := rows.Scan(&b.ID, &b.Name, &b.Game, &b.BoxType, &b.MaxChoices, &b.Rarity, &icon, &desc, &b.Status, &itemsJSON, &b.CreatedAt, &b.UpdatedAt); err == nil {
				b.Description = desc.String
				b.Icon = icon.String
				_ = json.Unmarshal([]byte(itemsJSON), &b.Items)
				list = append(list, b)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.GiftBoxes = list
		}
	}

	// 11. Mails
	if rows, err := s.db.Query("SELECT id, title, content, sender, game, target_type, target_id, min_level, status, attachments, sent_at, expires_at, claimed_count, total_target FROM mails ORDER BY sent_at DESC"); err == nil {
		var list []model.Mail
		for rows.Next() {
			var m model.Mail
			var attachmentsJSON string
			if err := rows.Scan(&m.ID, &m.Title, &m.Content, &m.Sender, &m.Game, &m.TargetType, &m.TargetID, &m.MinLevel, &m.Status, &attachmentsJSON, &m.SentAt, &m.ExpiresAt, &m.ClaimedCount, &m.TotalTarget); err == nil {
				_ = json.Unmarshal([]byte(attachmentsJSON), &m.Attachments)
				list = append(list, m)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.Mails = list
		}
	}

	// 12. CDKey Batches
	if rows, err := s.db.Query("SELECT id, name, type, code, game, min_level, total_count, used_count, status, rewards, created_at, expires_at, description FROM cdkey_batches ORDER BY created_at DESC"); err == nil {
		var list []model.CDKeyBatch
		for rows.Next() {
			var b model.CDKeyBatch
			var desc, code sql.NullString
			var rewardsJSON string
			if err := rows.Scan(&b.ID, &b.Name, &b.Type, &code, &b.Game, &b.MinLevel, &b.TotalCount, &b.UsedCount, &b.Status, &rewardsJSON, &b.CreatedAt, &b.ExpiresAt, &desc); err == nil {
				b.Code = code.String
				b.Description = desc.String
				_ = json.Unmarshal([]byte(rewardsJSON), &b.Rewards)
				list = append(list, b)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.CDKeyBatches = list
		}
	}

	// 13. CDKey Items
	if rows, err := s.db.Query("SELECT code, batch_id, status, player_id, used_at, expires_at FROM cdkey_items ORDER BY code ASC"); err == nil {
		var list []model.CDKeyItem
		for rows.Next() {
			var it model.CDKeyItem
			var pid, usedAt sql.NullString
			if err := rows.Scan(&it.Code, &it.BatchID, &it.Status, &pid, &usedAt, &it.ExpiresAt); err == nil {
				it.PlayerID = pid.String
				it.UsedAt = usedAt.String
				list = append(list, it)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.CDKeyItems = list
		}
	}

	// 14. CDKey Redemptions
	if rows, err := s.db.Query("SELECT id, code, batch_id, batch_name, player_id, player_name, game, time, rewards FROM cdkey_redemptions ORDER BY id DESC"); err == nil {
		var list []model.CDKeyRedemption
		for rows.Next() {
			var r model.CDKeyRedemption
			var rewardsJSON string
			if err := rows.Scan(&r.ID, &r.Code, &r.BatchID, &r.BatchName, &r.PlayerID, &r.PlayerName, &r.Game, &r.Time, &rewardsJSON); err == nil {
				_ = json.Unmarshal([]byte(rewardsJSON), &r.Rewards)
				list = append(list, r)
			}
		}
		_ = rows.Close()
		if len(list) > 0 {
			s.CDKeyRedemptions = list
		}
	}
}

func (s *DataStore) invalidateRedis(patterns ...string) {
	if s.rdb == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	for _, p := range patterns {
		if strings.Contains(p, "*") {
			keys, _ := s.rdb.Keys(ctx, p).Result()
			if len(keys) > 0 {
				_ = s.rdb.Del(ctx, keys...).Err()
			}
		} else {
			_ = s.rdb.Del(ctx, p).Err()
		}
	}
}

func (s *DataStore) Redis() *redis.Client {
	return s.rdb
}

func (s *DataStore) saveUnlocked() error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0644)
}

