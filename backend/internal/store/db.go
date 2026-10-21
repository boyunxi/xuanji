package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"xuanji-backend/internal/model"
)

type DBStore struct {
	db  *sql.DB
	rdb *redis.Client
}

func initPostgres() (*sql.DB, error) {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		host := getEnv("PG_HOST", "127.0.0.1")
		port := getEnv("PG_PORT", "5432")
		user := getEnv("PG_USER", "xuanji")
		pass := getEnv("PG_PASSWORD", "xuanji_pass")
		dbname := getEnv("PG_DBNAME", "xuanji")
		sslmode := getEnv("PG_SSLMODE", "disable")
		connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, pass, dbname, sslmode)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return db, nil
}

func initRedis() (*redis.Client, error) {
	addr := getEnv("REDIS_ADDR", "127.0.0.1:6379")
	pass := getEnv("REDIS_PASSWORD", "")

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: pass,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping redis: %w", err)
	}

	return rdb, nil
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func (s *DataStore) migrateAndSeedPG(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS games (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		display_order INT DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS players (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		game TEXT NOT NULL,
		level INT DEFAULT 1,
		spend NUMERIC DEFAULT 0,
		last_active TEXT,
		status TEXT DEFAULT '正常',
		tags TEXT DEFAULT '',
		remark TEXT DEFAULT ''
	);

	ALTER TABLE players ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';
	ALTER TABLE players ADD COLUMN IF NOT EXISTS remark TEXT DEFAULT '';

	CREATE TABLE IF NOT EXISTS events (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		game TEXT NOT NULL,
		start_date TEXT NOT NULL,
		end_date TEXT NOT NULL,
		participants INT DEFAULT 0,
		status TEXT DEFAULT '未开始'
	);

	CREATE TABLE IF NOT EXISTS announcements (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		game TEXT NOT NULL,
		date TEXT NOT NULL,
		content TEXT,
		status TEXT DEFAULT '草稿'
	);

	CREATE TABLE IF NOT EXISTS orders (
		id TEXT PRIMARY KEY,
		player TEXT NOT NULL,
		game TEXT NOT NULL,
		amount NUMERIC NOT NULL,
		method TEXT,
		time TEXT NOT NULL,
		status TEXT DEFAULT '处理中'
	);

	CREATE TABLE IF NOT EXISTS notices (
		id SERIAL PRIMARY KEY,
		title TEXT NOT NULL,
		time TEXT NOT NULL,
		page TEXT NOT NULL,
		read BOOLEAN DEFAULT FALSE
	);

	CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		daily BOOLEAN DEFAULT TRUE,
		orders BOOLEAN DEFAULT TRUE,
		events BOOLEAN DEFAULT FALSE
	);

	CREATE TABLE IF NOT EXISTS gm_logs (
		id TEXT PRIMARY KEY,
		operator TEXT NOT NULL,
		action TEXT NOT NULL,
		target TEXT NOT NULL,
		detail TEXT,
		time TEXT NOT NULL,
		status TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS game_logs (
		id TEXT PRIMARY KEY,
		game TEXT NOT NULL,
		server_id TEXT NOT NULL,
		player_id TEXT NOT NULL,
		player_name TEXT NOT NULL,
		category TEXT NOT NULL,
		action TEXT NOT NULL,
		detail TEXT,
		delta TEXT,
		ip TEXT,
		level TEXT DEFAULT 'INFO',
		time TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS shop_items (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		game TEXT NOT NULL,
		category TEXT NOT NULL,
		currency TEXT NOT NULL,
		price NUMERIC NOT NULL,
		original_price NUMERIC NOT NULL,
		stock INT DEFAULT -1,
		buy_limit TEXT DEFAULT '不限购',
		tag TEXT DEFAULT '',
		description TEXT,
		items TEXT,
		status TEXT DEFAULT '上架中',
		sort_order INT DEFAULT 0,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS game_items (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL UNIQUE,
		category TEXT NOT NULL,
		description TEXT,
		rarity TEXT DEFAULT '普通',
		is_custom BOOLEAN DEFAULT FALSE
	);

	CREATE TABLE IF NOT EXISTS gift_boxes (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		game TEXT NOT NULL,
		box_type TEXT NOT NULL,
		max_choices INT DEFAULT 1,
		rarity TEXT DEFAULT '史诗',
		icon TEXT DEFAULT 'box',
		description TEXT,
		status TEXT DEFAULT '已启用',
		items JSONB NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS mails (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		sender TEXT NOT NULL,
		game TEXT NOT NULL,
		target_type TEXT NOT NULL,
		target_id TEXT NOT NULL,
		min_level INT DEFAULT 1,
		status TEXT DEFAULT '已发送',
		attachments JSONB NOT NULL,
		sent_at TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		claimed_count INT DEFAULT 0,
		total_target INT DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS cdkey_batches (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		code TEXT,
		game TEXT NOT NULL,
		min_level INT DEFAULT 1,
		total_count INT DEFAULT 1,
		used_count INT DEFAULT 0,
		status TEXT DEFAULT '已启用',
		rewards JSONB NOT NULL,
		created_at TEXT NOT NULL,
		expires_at TEXT NOT NULL,
		description TEXT
	);

	CREATE TABLE IF NOT EXISTS cdkey_items (
		code TEXT PRIMARY KEY,
		batch_id TEXT NOT NULL,
		status TEXT DEFAULT '待兑换',
		player_id TEXT,
		used_at TEXT,
		expires_at TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_cdkey_items_batch ON cdkey_items(batch_id);

	CREATE TABLE IF NOT EXISTS cdkey_redemptions (
		id BIGSERIAL PRIMARY KEY,
		code TEXT NOT NULL,
		batch_id TEXT NOT NULL,
		batch_name TEXT NOT NULL,
		player_id TEXT NOT NULL,
		player_name TEXT NOT NULL,
		game TEXT NOT NULL,
		time TEXT NOT NULL,
		rewards JSONB NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_cdkey_redemptions_batch_player ON cdkey_redemptions(batch_id, player_id);
	`

	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("failed to create schema: %w", err)
	}

	// Seed Games if empty
	var gameCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM games").Scan(&gameCount)
	if gameCount == 0 {
		initialGames := []model.GameInfo{
			{ID: "all", Name: "全部游戏", DisplayOrder: 0},
			{ID: "shanhai", Name: "山海长歌", DisplayOrder: 1},
			{ID: "jiuzhou", Name: "九州志", DisplayOrder: 2},
			{ID: "yunjian", Name: "云间录", DisplayOrder: 3},
		}
		for _, g := range initialGames {
			_, _ = db.Exec("INSERT INTO games (id, name, display_order) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
				g.ID, g.Name, g.DisplayOrder)
		}
	}

	// Seed Players if empty
	var playerCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM players").Scan(&playerCount)
	if playerCount == 0 && len(s.Players) > 0 {
		for _, p := range s.Players {
			tagsStr := strings.Join(p.Tags, ",")
			_, _ = db.Exec("INSERT INTO players (id, name, game, level, spend, last_active, status, tags, remark) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING",
				p.ID, p.Name, p.Game, p.Level, p.Spend, p.LastActive, p.Status, tagsStr, p.Remark)
		}
	} else if len(s.Players) > 0 {
		// Sync seed tags & remarks for existing players if empty
		for _, p := range s.Players {
			if len(p.Tags) > 0 || p.Remark != "" {
				tagsStr := strings.Join(p.Tags, ",")
				_, _ = db.Exec("UPDATE players SET tags=$1, remark=$2 WHERE id=$3 AND (tags='' OR tags IS NULL)", tagsStr, p.Remark, p.ID)
			}
		}
	}

	// Seed Events if empty
	var eventCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM events").Scan(&eventCount)
	if eventCount == 0 && len(s.Events) > 0 {
		for _, e := range s.Events {
			_, _ = db.Exec("INSERT INTO events (id, title, game, start_date, end_date, participants, status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING",
				e.ID, e.Title, e.Game, e.Start, e.End, e.Participants, e.Status)
		}
	}

	// Seed Announcements if empty
	var annCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM announcements").Scan(&annCount)
	if annCount == 0 && len(s.Announcements) > 0 {
		for _, a := range s.Announcements {
			_, _ = db.Exec("INSERT INTO announcements (id, title, game, date, content, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
				a.ID, a.Title, a.Game, a.Date, a.Content, a.Status)
		}
	}

	// Seed Orders if empty
	var orderCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&orderCount)
	if orderCount == 0 && len(s.Orders) > 0 {
		for _, o := range s.Orders {
			_, _ = db.Exec("INSERT INTO orders (id, player, game, amount, method, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING",
				o.ID, o.Player, o.Game, o.Amount, o.Method, o.Time, o.Status)
		}
	}

	// Seed Notices if empty
	var noticeCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM notices").Scan(&noticeCount)
	if noticeCount == 0 && len(s.Notices) > 0 {
		for _, n := range s.Notices {
			_, _ = db.Exec("INSERT INTO notices (title, time, page, read) VALUES ($1, $2, $3, $4)",
				n.Title, n.Time, n.Page, n.Read)
		}
	}

	// Seed Settings if empty
	var settingsCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM settings").Scan(&settingsCount)
	if settingsCount == 0 {
		_, _ = db.Exec("INSERT INTO settings (key, daily, orders, events) VALUES ('default', $1, $2, $3) ON CONFLICT (key) DO NOTHING",
			s.Settings.Daily, s.Settings.Orders, s.Settings.Events)
	}

	// Seed Game Items if empty
	var itemCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM game_items").Scan(&itemCount)
	if itemCount == 0 {
		initialItems := []model.GameItem{
			{ID: "ITEM_101", Name: "元宝", Category: "通用货币", Description: "最高价值通货，用于商城直购与抽奖", Rarity: "传说"},
			{ID: "ITEM_102", Name: "灵石", Category: "通用货币", Description: "修炼基础资源，用于洞府与功法升级", Rarity: "稀有"},
			{ID: "ITEM_103", Name: "仙玉", Category: "通用货币", Description: "跨服战役特殊代币，兑换限定外观", Rarity: "史诗"},
			{ID: "ITEM_104", Name: "银两", Category: "通用货币", Description: "日常主线流通货币，NPC交易使用", Rarity: "普通"},
			{ID: "ITEM_105", Name: "宗门贡献", Category: "通用货币", Description: "宗门活动产出，兑换宗门藏经阁秘籍", Rarity: "普通"},
			{ID: "ITEM_201", Name: "九转金丹", Category: "修炼丹药", Description: "渡劫破境神丹，提升突破成功率100%", Rarity: "传说"},
			{ID: "ITEM_202", Name: "凝气丹", Category: "修炼丹药", Description: "炼气化神基础灵药，快速提升角色经验", Rarity: "普通"},
			{ID: "ITEM_203", Name: "洗髓丹", Category: "修炼丹药", Description: "洗练经脉资质，重置所有自由潜能点", Rarity: "稀有"},
			{ID: "ITEM_204", Name: "大还丹", Category: "修炼丹药", Description: "瞬时恢复全部生命气血与法力真气", Rarity: "稀有"},
			{ID: "ITEM_205", Name: "渡劫保命符", Category: "修炼丹药", Description: "天劫雷罚失败时免受修为倒退惩罚", Rarity: "史诗"},
			{ID: "ITEM_301", Name: "强化神石", Category: "锻造材料", Description: "神兵精炼必备石材，提高强化成功概率", Rarity: "史诗"},
			{ID: "ITEM_302", Name: "天外陨铁", Category: "锻造材料", Description: "重铸装备附加极品词条的核心材料", Rarity: "史诗"},
			{ID: "ITEM_303", Name: "寒铁精魄", Category: "锻造材料", Description: "千年极寒玄铁提炼，兵刃升阶材料", Rarity: "稀有"},
			{ID: "ITEM_304", Name: "凤羽流金", Category: "锻造材料", Description: "神鸟凤凰遗留赤羽，防具附魔顶级材料", Rarity: "传说"},
			{ID: "ITEM_305", Name: "乾坤石", Category: "锻造材料", Description: "用于拓展角色背包与宗门乾坤仓库空间", Rarity: "普通"},
			{ID: "ITEM_401", Name: "太虚飞剑", Category: "极品装备", Description: "纯阳无极神兵，御剑飞行时提升移速80%", Rarity: "传说"},
			{ID: "ITEM_402", Name: "斩龙古剑", Category: "极品装备", Description: "附带高额真伤与暴击伤害的太古名剑", Rarity: "史诗"},
			{ID: "ITEM_403", Name: "诛仙阵图", Category: "极品装备", Description: "绝世杀伐阵法法宝，对全屏敌对目标造成重创", Rarity: "传说"},
			{ID: "ITEM_404", Name: "混元金斗", Category: "极品装备", Description: "上古封神仙器，战斗时禁锢敌方主动战法", Rarity: "史诗"},
			{ID: "ITEM_405", Name: "伏魔宝镜", Category: "极品装备", Description: "破除一切隐身与虚妄状态的灵宝", Rarity: "稀有"},
			{ID: "ITEM_501", Name: "限定坐骑·墨麒麟", Category: "外观坐骑", Description: "开服全区首发极品神兽坐骑，自带祥瑞云雾", Rarity: "传说"},
			{ID: "ITEM_502", Name: "踏雪白鹿", Category: "外观坐骑", Description: "仙风道骨灵兽外观，提升移动速度60%", Rarity: "史诗"},
			{ID: "ITEM_503", Name: "九霄云雀", Category: "外观坐骑", Description: "华丽飞行坐骑，免疫沼泽与水面减速地形", Rarity: "史诗"},
			{ID: "ITEM_504", Name: "苍龙出海·神尊战袍", Category: "外观坐骑", Description: "至尊限定时装，出场伴随金龙环绕特效", Rarity: "传说"},
		}
		for _, it := range initialItems {
			_, _ = db.Exec("INSERT INTO game_items (id, name, category, description, rarity, is_custom) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
				it.ID, it.Name, it.Category, it.Description, it.Rarity, it.IsCustom)
		}
	}

	// Seed Gift Boxes if empty
	var boxCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM gift_boxes").Scan(&boxCount)
	if boxCount == 0 {
		initialBoxes := []model.GiftBox{
			{
				ID:          "BOX_2401",
				Name:        "开服至尊必得大礼包",
				Game:        "山海长歌",
				BoxType:     model.BoxTypeFixed,
				MaxChoices:  1,
				Rarity:      "传说",
				Icon:        "crown",
				Description: "直接开箱获得全额物资：元宝x10000、九转金丹x10、强化神石x50，开荒无忧。",
				Status:      "已启用",
				Items: []model.GiftBoxItem{
					{ItemName: "元宝", Category: "通用货币", Amount: 10000, Probability: 100, Rarity: "传说"},
					{ItemName: "九转金丹", Category: "修炼丹药", Amount: 10, Probability: 100, Rarity: "传说"},
					{ItemName: "强化神石", Category: "锻造材料", Amount: 50, Probability: 100, Rarity: "史诗"},
				},
				CreatedAt: "2026-10-15 10:00:00",
				UpdatedAt: "2026-10-15 10:00:00",
			},
			{
				ID:          "BOX_2402",
				Name:        "太古鸿蒙神兽天降盲盒",
				Game:        "全部游戏",
				BoxType:     model.BoxTypeRandomProb,
				MaxChoices:  1,
				Rarity:      "传说",
				Icon:        "sparkles",
				Description: "开启后按概率权重随机开出神兽或珍稀修行资源，极小概率直接开出限定墨麒麟！",
				Status:      "已启用",
				Items: []model.GiftBoxItem{
					{ItemName: "限定坐骑·墨麒麟", Category: "外观坐骑", Amount: 1, Probability: 3.5, Rarity: "传说"},
					{ItemName: "踏雪白鹿", Category: "外观坐骑", Amount: 1, Probability: 11.5, Rarity: "史诗"},
					{ItemName: "九霄云雀", Category: "外观坐骑", Amount: 1, Probability: 25.0, Rarity: "史诗"},
					{ItemName: "灵石", Category: "通用货币", Amount: 10000, Probability: 60.0, Rarity: "稀有"},
				},
				CreatedAt: "2026-10-15 11:30:00",
				UpdatedAt: "2026-10-15 11:30:00",
			},
			{
				ID:          "BOX_2403",
				Name:        "绝世神兵传世自选礼盒",
				Game:        "山海长歌",
				BoxType:     model.BoxTypeSingleChoice,
				MaxChoices:  1,
				Rarity:      "传说",
				Icon:        "sword",
				Description: "单选自选礼盒（5选1）：打开后可从五柄无上古神兵中任选其一，专属定制成长路线。",
				Status:      "已启用",
				Items: []model.GiftBoxItem{
					{ItemName: "太虚飞剑", Category: "极品装备", Amount: 1, Rarity: "传说"},
					{ItemName: "斩龙古剑", Category: "极品装备", Amount: 1, Rarity: "史诗"},
					{ItemName: "诛仙阵图", Category: "极品装备", Amount: 1, Rarity: "传说"},
					{ItemName: "混元金斗", Category: "极品装备", Amount: 1, Rarity: "史诗"},
					{ItemName: "伏魔宝镜", Category: "极品装备", Amount: 1, Rarity: "稀有"},
				},
				CreatedAt: "2026-10-15 14:00:00",
				UpdatedAt: "2026-10-15 14:00:00",
			},
			{
				ID:          "BOX_2404",
				Name:        "宗门飞升突破多选自选箱",
				Game:        "九州志",
				BoxType:     model.BoxTypeMultiChoice,
				MaxChoices:  2,
				Rarity:      "史诗",
				Icon:        "box",
				Description: "多选自选礼盒（6选2）：从6种宗门高阶稀缺材料中任选2样，满足不同阶段修炼诉求。",
				Status:      "已启用",
				Items: []model.GiftBoxItem{
					{ItemName: "天外陨铁", Category: "锻造材料", Amount: 10, Rarity: "史诗"},
					{ItemName: "凤羽流金", Category: "锻造材料", Amount: 10, Rarity: "传说"},
					{ItemName: "寒铁精魄", Category: "锻造材料", Amount: 30, Rarity: "稀有"},
					{ItemName: "渡劫保命符", Category: "修炼丹药", Amount: 5, Rarity: "史诗"},
					{ItemName: "洗髓丹", Category: "修炼丹药", Amount: 20, Rarity: "稀有"},
					{ItemName: "仙玉", Category: "通用货币", Amount: 1000, Rarity: "史诗"},
				},
				CreatedAt: "2026-10-15 15:20:00",
				UpdatedAt: "2026-10-15 15:20:00",
			},
		}

		for _, b := range initialBoxes {
			itemsBytes, _ := json.Marshal(b.Items)
			_, _ = db.Exec(`INSERT INTO gift_boxes (id, name, game, box_type, max_choices, rarity, icon, description, status, items, created_at, updated_at) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
				b.ID, b.Name, b.Game, b.BoxType, b.MaxChoices, b.Rarity, b.Icon, b.Description, b.Status, string(itemsBytes), b.CreatedAt, b.UpdatedAt)
		}
	}

	// Seed Mails if empty
	var mailCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM mails").Scan(&mailCount)
	if mailCount == 0 && len(s.Mails) > 0 {
		for _, m := range s.Mails {
			attachBytes, _ := json.Marshal(m.Attachments)
			_, _ = db.Exec(`INSERT INTO mails (id, title, content, sender, game, target_type, target_id, min_level, status, attachments, sent_at, expires_at, claimed_count, total_target)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
				m.ID, m.Title, m.Content, m.Sender, m.Game, m.TargetType, m.TargetID, m.MinLevel, m.Status, string(attachBytes), m.SentAt, m.ExpiresAt, m.ClaimedCount, m.TotalTarget)
		}
	}

	// Seed CDKey Batches if empty
	var batchCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM cdkey_batches").Scan(&batchCount)
	if batchCount == 0 && len(s.CDKeyBatches) > 0 {
		for _, b := range s.CDKeyBatches {
			rewBytes, _ := json.Marshal(b.Rewards)
			_, _ = db.Exec(`INSERT INTO cdkey_batches (id, name, type, code, game, min_level, total_count, used_count, status, rewards, created_at, expires_at, description)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
				b.ID, b.Name, b.Type, b.Code, b.Game, b.MinLevel, b.TotalCount, b.UsedCount, b.Status, string(rewBytes), b.CreatedAt, b.ExpiresAt, b.Description)
		}
	}

	// Seed CDKey Items if empty
	var itemCountCheck int
	_ = db.QueryRow("SELECT COUNT(*) FROM cdkey_items").Scan(&itemCountCheck)
	if itemCountCheck == 0 && len(s.CDKeyItems) > 0 {
		for _, it := range s.CDKeyItems {
			_, _ = db.Exec(`INSERT INTO cdkey_items (code, batch_id, status, player_id, used_at, expires_at)
				VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
				it.Code, it.BatchID, it.Status, it.PlayerID, it.UsedAt, it.ExpiresAt)
		}
	}

	// Seed CDKey Redemptions if empty
	var redCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM cdkey_redemptions").Scan(&redCount)
	if redCount == 0 && len(s.CDKeyRedemptions) > 0 {
		for _, r := range s.CDKeyRedemptions {
			rewBytes, _ := json.Marshal(r.Rewards)
			_, _ = db.Exec(`INSERT INTO cdkey_redemptions (id, code, batch_id, batch_name, player_id, player_name, game, time, rewards)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
				r.ID, r.Code, r.BatchID, r.BatchName, r.PlayerID, r.PlayerName, r.Game, r.Time, string(rewBytes))
		}
	}

	// Seed GM Logs with default seed entries if not present
	for _, l := range GetDefaultGMLogs() {
		_, _ = db.Exec(`INSERT INTO gm_logs (id, operator, action, target, detail, time, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
			l.ID, l.Operator, l.Action, l.Target, l.Detail, l.Time, l.Status)
	}

	// Seed Game Logs with default seed entries if not present
	for _, gl := range GetDefaultGameLogs() {
		_, _ = db.Exec(`INSERT INTO game_logs (id, game, server_id, player_id, player_name, category, action, detail, delta, ip, level, time)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
			gl.ID, gl.Game, gl.ServerID, gl.PlayerID, gl.PlayerName, gl.Category, gl.Action, gl.Detail, gl.Delta, gl.IP, gl.Level, gl.Time)
	}

	// Seed Shop Items with default entries if not present
	for _, si := range GetDefaultShopItems() {
		_, _ = db.Exec(`INSERT INTO shop_items (id, name, game, category, currency, price, original_price, stock, buy_limit, tag, description, items, status, sort_order, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT (id) DO NOTHING`,
			si.ID, si.Name, si.Game, si.Category, si.Currency, si.Price, si.OriginalPrice, si.Stock, si.BuyLimit, si.Tag, si.Description, si.Items, si.Status, si.SortOrder, si.CreatedAt, si.UpdatedAt)
	}

	log.Printf("[PostgreSQL] Tables verified & seed check complete.")
	return nil
}

