package store

import (
	"fmt"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

func dateFromNow(days int) string {
	t := time.Now().AddDate(0, 0, days)
	return t.Format("2006-01-02")
}

func orderID(days int, sequence string) string {
	d := dateFromNow(days)
	clean := strings.ReplaceAll(d, "-", "")
	if len(clean) >= 2 {
		clean = clean[2:]
	}
	return fmt.Sprintf("XC%s%s", clean, sequence)
}

// GetDefaultGMLogs returns default seeded GM logs for auditing
func GetDefaultGMLogs() []model.GMLog {
	return []model.GMLog{
		{ID: "GM891028", Operator: "林管理员", Action: "发放道具", Target: "山海长歌 · XJ100248", Detail: "发放 元宝 x2000 (原因: 跨服排位掉线补发) [游戏服驱动返回: 发放成功]", Time: fmt.Sprintf("%s 15:42:10", dateFromNow(0)), Status: "成功"},
		{ID: "GM891026", Operator: "林管理员", Action: "定制礼盒下发", Target: "云间录 · XJ100301", Detail: "下发定制礼包 [至尊飞升礼匣] x1 (包含太虚飞剑、九转金丹)", Time: fmt.Sprintf("%s 14:18:05", dateFromNow(0)), Status: "成功"},
		{ID: "GM891023", Operator: "璇玑掌印官", Action: "全服广播", Target: "九州志", Detail: "[高优先级广播] 本服将于今日 23:50 开启决战巅峰赛事，请诸位侠士提前进场", Time: fmt.Sprintf("%s 11:20:00", dateFromNow(0)), Status: "成功"},
		{ID: "GM891021", Operator: "林管理员", Action: "发放道具", Target: "山海长歌 · XJ100248", Detail: "发放 太虚灵石 x500 (原因: 补偿维护延时) [已入账]", Time: fmt.Sprintf("%s 10:15:20", dateFromNow(0)), Status: "成功"},
		{ID: "GM891019", Operator: "赵执事", Action: "补偿信函特派", Target: "全部游戏 · 全服道友", Detail: "起草并下发全服维护致歉补偿函 (MAIL_2401) 触达 24,800 人", Time: fmt.Sprintf("%s 09:45:12", dateFromNow(0)), Status: "成功"},
		{ID: "GM891018", Operator: "林管理员", Action: "全服广播", Target: "九州志", Detail: "[系统跑马灯] 九州论剑决赛即将开启，请各服少侠做好准备", Time: fmt.Sprintf("%s 09:30:00", dateFromNow(0)), Status: "成功"},
		{ID: "GM891015", Operator: "安全巡查系统", Action: "玩家封禁", Target: "山海长歌 · XJ100999", Detail: "检测到非法内存变速异常行为，自动封停账号 7 日", Time: fmt.Sprintf("%s 08:12:34", dateFromNow(0)), Status: "成功"},
		{ID: "GM891010", Operator: "林管理员", Action: "生成CDKey", Target: "九州志 · 通用福利", Detail: "生成春季全员福利礼包码 (SP_961318) 限额 10,000 次", Time: fmt.Sprintf("%s 18:20:00", dateFromNow(-1)), Status: "成功"},
		{ID: "GM891008", Operator: "璇玑掌印官", Action: "执行指令", Target: "云间录", Detail: "执行动态调试指令: reload_dungeon_instances (清理野外副本格林死锁)", Time: fmt.Sprintf("%s 16:05:40", dateFromNow(-1)), Status: "成功"},
		{ID: "GM891004", Operator: "林管理员", Action: "重载配表", Target: "全服服务器", Detail: "全区服游戏掉落与数值配置表已热重载，耗时 124ms", Time: fmt.Sprintf("%s 22:00:15", dateFromNow(-1)), Status: "成功"},
		{ID: "GM891002", Operator: "安全系统", Action: "登录鉴权", Target: "管理控制台", Detail: "管理员 [admin] 通过双重密钥鉴权从 127.0.0.1 成功登录", Time: fmt.Sprintf("%s 09:00:22", dateFromNow(-1)), Status: "成功"},
		{ID: "GM890998", Operator: "陈执事", Action: "紧急召回信函", Target: "山海长歌", Detail: "紧急召回异常错发道具信函 (MAIL_2404)，阻断未领礼包 142 份", Time: fmt.Sprintf("%s 17:30:10", dateFromNow(-2)), Status: "成功"},
		{ID: "GM890995", Operator: "未知外部访问", Action: "登录鉴权", Target: "管理控制台", Detail: "检测到连续密码试探失败 (IP: 198.51.100.24)，触发安全风控拦截", Time: fmt.Sprintf("%s 03:15:08", dateFromNow(-2)), Status: "失败"},
	}
}

func (s *DataStore) seedDefaultData() {
	s.Games = []model.GameInfo{
		{ID: "all", Name: "全部区服", DisplayOrder: 0},
		{ID: "shanhai", Name: "山海长歌", DisplayOrder: 1},
		{ID: "jiuzhou", Name: "九州志", DisplayOrder: 2},
		{ID: "yunjian", Name: "云间录", DisplayOrder: 3},
	}

	s.Players = []model.Player{
		{ID: "XJ100248", Name: "听风入梦", Game: "山海长歌", Level: 86, Spend: 3280, LastActive: "今天 10:42", Status: "正常", Tags: []string{"修仙榜首", "大R道友"}, Remark: "跨服天梯S1赛季总冠军，专属VIP客服一对一维护"},
		{ID: "XJ100689", Name: "拾光者", Game: "山海长歌", Level: 91, Spend: 5680, LastActive: "昨天 22:13", Status: "正常", Tags: []string{"活跃帮主"}, Remark: "第一大宗门[天工开物]执掌长老，多次组织跨服开荒"},
		{ID: "XJ100731", Name: "长安旧梦", Game: "九州志", Level: 58, Spend: 320, LastActive: "昨天 18:35", Status: "已封禁", Tags: []string{"重点监控"}, Remark: "检测到非法瞬移与封包变速异常，安全合规风控组持续关注"},
		{ID: "XJ100367", Name: "青山客", Game: "九州志", Level: 72, Spend: 1680, LastActive: "今天 09:18", Status: "正常", Tags: []string{}, Remark: ""},
		{ID: "XJ100512", Name: "月照归舟", Game: "云间录", Level: 64, Spend: 980, LastActive: "今天 08:56", Status: "正常", Tags: []string{}, Remark: ""},
		{ID: "XJ100845", Name: "云深不知处", Game: "云间录", Level: 77, Spend: 2580, LastActive: "昨天 16:09", Status: "正常", Tags: []string{}, Remark: ""},
		{ID: "XJ100926", Name: "一叶知秋", Game: "山海长歌", Level: 43, Spend: 128, LastActive: "2天前", Status: "正常", Tags: []string{}, Remark: ""},
	}

	s.Events = []model.Event{
		{ID: "EV2401", Title: "春山有信", Game: "山海长歌", Start: dateFromNow(2), End: dateFromNow(9), Participants: 0, Status: "未开始"},
		{ID: "EV2402", Title: "九州问剑", Game: "九州志", Start: dateFromNow(-2), End: dateFromNow(5), Participants: 12846, Status: "进行中"},
		{ID: "EV2403", Title: "月下寻宝", Game: "云间录", Start: dateFromNow(-4), End: dateFromNow(3), Participants: 8620, Status: "进行中"},
		{ID: "EV2404", Title: "山海奇遇", Game: "山海长歌", Start: dateFromNow(-18), End: dateFromNow(-4), Participants: 24518, Status: "已结束"},
		{ID: "EV2405", Title: "踏云之约", Game: "云间录", Start: dateFromNow(7), End: dateFromNow(14), Participants: 0, Status: "未开始"},
	}

	s.Announcements = []model.Announcement{
		{ID: "AN3101", Title: "版本更新说明", Game: "山海长歌", Date: dateFromNow(0), Content: "新版本现已上线，优化了游戏体验并修复部分已知问题。", Status: "已发布"},
		{ID: "AN3102", Title: "服务器维护通知", Game: "九州志", Date: dateFromNow(-1), Content: "服务器将进行例行维护，具体时间请以游戏内通知为准。", Status: "已发布"},
		{ID: "AN3103", Title: "春山有信活动预告", Game: "山海长歌", Date: dateFromNow(-1), Content: "春山有信活动即将开启，参与活动可获得限定奖励。", Status: "草稿"},
		{ID: "AN3104", Title: "月下寻宝开启公告", Game: "云间录", Date: dateFromNow(-3), Content: "月下寻宝活动已开启，欢迎各位玩家参与。", Status: "已发布"},
	}

	s.Orders = []model.Order{
		{ID: orderID(0, "0421"), Player: "听风入梦", Game: "山海长歌", Amount: 328, Method: "微信支付", Time: fmt.Sprintf("%s 10:42", dateFromNow(0)), Status: "成功"},
		{ID: orderID(0, "0419"), Player: "青山客", Game: "九州志", Amount: 68, Method: "支付宝", Time: fmt.Sprintf("%s 10:18", dateFromNow(0)), Status: "成功"},
		{ID: orderID(0, "0416"), Player: "月照归舟", Game: "云间录", Amount: 198, Method: "微信支付", Time: fmt.Sprintf("%s 09:56", dateFromNow(0)), Status: "处理中"},
		{ID: orderID(0, "0408"), Player: "拾光者", Game: "山海长歌", Amount: 648, Method: "支付宝", Time: fmt.Sprintf("%s 09:24", dateFromNow(0)), Status: "成功"},
		{ID: orderID(-1, "0398"), Player: "一叶知秋", Game: "山海长歌", Amount: 30, Method: "微信支付", Time: fmt.Sprintf("%s 20:31", dateFromNow(-1)), Status: "已退款"},
		{ID: orderID(-1, "0392"), Player: "云深不知处", Game: "云间录", Amount: 128, Method: "支付宝", Time: fmt.Sprintf("%s 18:07", dateFromNow(-1)), Status: "处理中"},
	}

	s.Notices = []model.Notice{
		{ID: 1, Title: "春山有信活动待开启", Time: "2小时前", Page: "events", Read: false},
		{ID: 2, Title: "有 2 笔订单待核对", Time: "3小时前", Page: "orders", Read: false},
		{ID: 3, Title: "本周运营数据已更新", Time: "今天 08:30", Page: "reports", Read: false},
	}

	s.Settings = model.Settings{
		Daily:  true,
		Orders: true,
		Events: false,
	}

	s.GMLogs = GetDefaultGMLogs()

	s.Mails = []model.Mail{
		{
			ID:           "MAIL_2401",
			Title:        "全服停服例行维护补偿与致歉函",
			Content:      "亲爱的各位道友：为提供更流畅的修仙大世界体验，本周例行停机维护已圆满结束。为答谢道友们的耐心理性守候，特附上天工灵玉与破境物资，祝各位仙途顺遂！",
			Sender:       "璇玑运营司",
			Game:         "全部游戏",
			TargetType:   "all",
			TargetID:     "ALL",
			MinLevel:     10,
			Status:       "已发送",
			SentAt:       fmt.Sprintf("%s 10:00:00", dateFromNow(0)),
			ExpiresAt:    fmt.Sprintf("%s 23:59:59", dateFromNow(7)),
			ClaimedCount: 18420,
			TotalTarget:  24800,
			Attachments: []model.MailAttachment{
				{ItemID: "ITEM_101", ItemName: "元宝", Category: "通用货币", Amount: 1000, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_201", ItemName: "九转金丹", Category: "修炼丹药", Amount: 5, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_103", ItemName: "仙玉", Category: "通用货币", Amount: 200, Rarity: "史诗", IsBox: false},
			},
		},
		{
			ID:           "MAIL_2402",
			Title:        "迎新狂欢 · 宗门掌门飞升专属赠礼",
			Content:      "恭喜道友成功晋升一派掌门！宗门藏宝阁特此赐予开服至尊必得大礼包一份，助尔开拓宗门洞府，招纳四海贤才。",
			Sender:       "山海运营组",
			Game:         "山海长歌",
			TargetType:   "all",
			TargetID:     "ALL",
			MinLevel:     20,
			Status:       "已发送",
			SentAt:       fmt.Sprintf("%s 14:30:00", dateFromNow(-1)),
			ExpiresAt:    fmt.Sprintf("%s 23:59:59", dateFromNow(13)),
			ClaimedCount: 6512,
			TotalTarget:  8900,
			Attachments: []model.MailAttachment{
				{ItemID: "BOX_2401", ItemName: "开服至尊必得大礼包", Category: "定制礼匣", Amount: 1, Rarity: "传说", IsBox: true},
				{ItemID: "ITEM_102", ItemName: "灵石", Category: "通用货币", Amount: 50000, Rarity: "稀有", IsBox: false},
			},
		},
		{
			ID:           "MAIL_2403",
			Title:        "【定向特派】充值大额返利差额紧急补发",
			Content:      "尊敬的高阶玩家道友您好：经运营与技术核实，您于昨日参与的累充返利活动由于跨服结算延迟未按时到账。特此补发差额物资及绝世飞剑一把以表歉意。",
			Sender:       "VIP执事处",
			Game:         "山海长歌",
			TargetType:   "player",
			TargetID:     "XJ100689",
			MinLevel:     1,
			Status:       "已发送",
			SentAt:       fmt.Sprintf("%s 18:20:00", dateFromNow(-2)),
			ExpiresAt:    fmt.Sprintf("%s 23:59:59", dateFromNow(28)),
			ClaimedCount: 1,
			TotalTarget:  1,
			Attachments: []model.MailAttachment{
				{ItemID: "ITEM_101", ItemName: "元宝", Category: "通用货币", Amount: 5000, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_401", ItemName: "太虚飞剑", Category: "极品装备", Amount: 1, Rarity: "传说", IsBox: false},
			},
		},
	}

	s.CDKeyBatches = []model.CDKeyBatch{
		{
			ID:          "CDK_BATCH_01",
			Name:        "全服通用迎新豪华礼包",
			Type:        model.CDKeyTypeUniversal,
			Code:        "VIP666",
			Game:        "全部游戏",
			MinLevel:    1,
			TotalCount:  999999,
			UsedCount:   14280,
			Status:      "已启用",
			CreatedAt:   fmt.Sprintf("%s 10:00:00", dateFromNow(-5)),
			ExpiresAt:   fmt.Sprintf("%s 23:59:59", dateFromNow(60)),
			Description: "全平台通用开服福利礼包，每个账号仅可兑换一次",
			Rewards: []model.CDKeyReward{
				{ItemID: "ITEM_101", ItemName: "元宝", Category: "通用货币", Amount: 666, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_202", ItemName: "凝气丹", Category: "修炼丹药", Amount: 10, Rarity: "普通", IsBox: false},
				{ItemID: "ITEM_104", ItemName: "银两", Category: "通用货币", Amount: 50000, Rarity: "普通", IsBox: false},
			},
		},
		{
			ID:          "CDK_BATCH_02",
			Name:        "开服大吉·至尊飞升礼",
			Type:        model.CDKeyTypeUniversal,
			Code:        "XUANJI2026",
			Game:        "山海长歌",
			MinLevel:    10,
			TotalCount:  999999,
			UsedCount:   8850,
			Status:      "已启用",
			CreatedAt:   fmt.Sprintf("%s 12:00:00", dateFromNow(-3)),
			ExpiresAt:   fmt.Sprintf("%s 23:59:59", dateFromNow(30)),
			Description: "山海长歌专区10级以上道友特供飞升礼盒",
			Rewards: []model.CDKeyReward{
				{ItemID: "ITEM_201", ItemName: "九转金丹", Category: "修炼丹药", Amount: 2, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_301", ItemName: "强化神石", Category: "锻造材料", Amount: 20, Rarity: "史诗", IsBox: false},
				{ItemID: "BOX_2404", ItemName: "宗门飞升突破多选自选箱", Category: "定制礼匣", Amount: 1, Rarity: "史诗", IsBox: true},
			},
		},
		{
			ID:          "CDK_BATCH_03",
			Name:        "TAPTAP渠道专属首发独占卡密",
			Type:        model.CDKeyTypeUnique,
			Code:        "",
			Game:        "九州志",
			MinLevel:    1,
			TotalCount:  20,
			UsedCount:   2,
			Status:      "已启用",
			CreatedAt:   fmt.Sprintf("%s 09:00:00", dateFromNow(-1)),
			ExpiresAt:   fmt.Sprintf("%s 23:59:59", dateFromNow(45)),
			Description: "一码一兑渠道合作批量发卡，包含20张卡密",
			Rewards: []model.CDKeyReward{
				{ItemID: "ITEM_101", ItemName: "元宝", Category: "通用货币", Amount: 1000, Rarity: "传说", IsBox: false},
				{ItemID: "ITEM_401", ItemName: "太虚飞剑", Category: "极品装备", Amount: 1, Rarity: "传说", IsBox: false},
			},
		},
	}

	uniqueExp := fmt.Sprintf("%s 23:59:59", dateFromNow(45))
	var uniqueItems []model.CDKeyItem
	for i := 1; i <= 20; i++ {
		code := fmt.Sprintf("XJ-TAP-89F1-%04d", 1000+i)
		status := "待兑换"
		pid := ""
		usedAt := ""
		if i == 1 {
			status = "已兑换"
			pid = "XJ100367"
			usedAt = fmt.Sprintf("%s 10:15:20", dateFromNow(0))
		} else if i == 2 {
			status = "已兑换"
			pid = "XJ100248"
			usedAt = fmt.Sprintf("%s 11:32:00", dateFromNow(0))
		}
		uniqueItems = append(uniqueItems, model.CDKeyItem{
			Code:      code,
			BatchID:   "CDK_BATCH_03",
			Status:    status,
			PlayerID:  pid,
			UsedAt:    usedAt,
			ExpiresAt: uniqueExp,
		})
	}
	s.CDKeyItems = uniqueItems

	s.CDKeyRedemptions = []model.CDKeyRedemption{
		{
			ID:         1,
			Code:       "VIP666",
			BatchID:    "CDK_BATCH_01",
			BatchName:  "全服通用迎新豪华礼包",
			PlayerID:   "XJ100248",
			PlayerName: "听风入梦",
			Game:       "山海长歌",
			Time:       fmt.Sprintf("%s 09:12:00", dateFromNow(0)),
			Rewards:    s.CDKeyBatches[0].Rewards,
		},
		{
			ID:         2,
			Code:       "XJ-TAP-89F1-1001",
			BatchID:    "CDK_BATCH_03",
			BatchName:  "TAPTAP渠道专属首发独占卡密",
			PlayerID:   "XJ100367",
			PlayerName: "青山客",
			Game:       "九州志",
			Time:       fmt.Sprintf("%s 10:15:20", dateFromNow(0)),
			Rewards:    s.CDKeyBatches[2].Rewards,
		},
		{
			ID:         3,
			Code:       "XJ-TAP-89F1-1002",
			BatchID:    "CDK_BATCH_03",
			BatchName:  "TAPTAP渠道专属首发独占卡密",
			PlayerID:   "XJ100248",
			PlayerName: "听风入梦",
			Game:       "九州志",
			Time:       fmt.Sprintf("%s 11:32:00", dateFromNow(0)),
			Rewards:    s.CDKeyBatches[2].Rewards,
		},
	}

	s.GameLogs = GetDefaultGameLogs()
	s.ShopItems = GetDefaultShopItems()
}

// GetDefaultGameLogs returns high-fidelity game server runtime and player behavior logs
func GetDefaultGameLogs() []model.GameLog {
	return []model.GameLog{
		{
			ID:         "GL202610210001",
			Game:       "山海长歌",
			ServerID:   "沧海流云-1服",
			PlayerID:   "XJ100248",
			PlayerName: "听风入梦",
			Category:   "经济流水",
			Action:     "商城消费",
			Detail:     "玩家在珍宝阁购买 [九转还魂金丹] x5，单价 120 仙玉",
			Delta:      "-600 仙玉",
			IP:         "114.249.32.18",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 21:35:12", dateFromNow(0)),
		},
		{
			ID:         "GL202610210002",
			Game:       "九州志",
			ServerID:   "九州巅峰-2服",
			PlayerID:   "XJ100367",
			PlayerName: "青山客",
			Category:   "玩法战斗",
			Action:     "世界Boss击杀",
			Detail:     "参与围攻世界首领 [赤炎金猊兽]，打出斩杀伤害 48,290,000 点，获得首杀宝箱",
			Delta:      "+1 斩龙宝匣",
			IP:         "183.210.45.67",
			Level:      "CRITICAL",
			Time:       fmt.Sprintf("%s 21:10:45", dateFromNow(0)),
		},
		{
			ID:         "GL202610210003",
			Game:       "云间录",
			ServerID:   "太虚幻境-1服",
			PlayerID:   "XJ100512",
			PlayerName: "月照归舟",
			Category:   "道具获取",
			Action:     "限定祈愿十连",
			Detail:     "消耗天工天璇令抽取 [天外飞仙] 卡池，触发保底机制获得传说武器 [太虚神剑]",
			Delta:      "+1 太虚神剑 (传说)",
			IP:         "221.192.10.88",
			Level:      "CRITICAL",
			Time:       fmt.Sprintf("%s 20:45:00", dateFromNow(0)),
		},
		{
			ID:         "GL202610210004",
			Game:       "山海长歌",
			ServerID:   "沧海流云-1服",
			PlayerID:   "XJ100689",
			PlayerName: "拾光者",
			Category:   "角色成长",
			Action:     "渡劫境界突破",
			Detail:     "集齐四象灵韵渡天道雷劫成功，由 [化神后期] 突破至 [合体初期]，战力提升 185,000",
			Delta:      "+185,000 战力",
			IP:         "117.136.88.23",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 19:22:30", dateFromNow(0)),
		},
		{
			ID:         "GL202610210005",
			Game:       "九州志",
			ServerID:   "九州巅峰-2服",
			PlayerID:   "XJ100731",
			PlayerName: "长安旧梦",
			Category:   "安全风控",
			Action:     "战斗封包异常",
			Detail:     "检测到瞬时移动速度异常超标 (145.2 m/s > 正常阈值 18.0 m/s)，已阻断坐标同步",
			Delta:      "触发反外挂警告",
			IP:         "101.89.201.12",
			Level:      "WARN",
			Time:       fmt.Sprintf("%s 18:35:10", dateFromNow(0)),
		},
		{
			ID:         "GL202610210006",
			Game:       "山海长歌",
			ServerID:   "沧海流云-1服",
			PlayerID:   "XJ100248",
			PlayerName: "听风入梦",
			Category:   "经济流水",
			Action:     "充值入账",
			Detail:     "微信支付 328 元购买 [3280 灵玉特惠包]，触发双倍首充赠送 3280 灵玉",
			Delta:      "+6560 灵玉",
			IP:         "114.249.32.18",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 10:42:05", dateFromNow(0)),
		},
		{
			ID:         "GL202610210007",
			Game:       "云间录",
			ServerID:   "太虚幻境-1服",
			PlayerID:   "XJ100845",
			PlayerName: "云深不知处",
			Category:   "玩法战斗",
			Action:     "天梯论剑",
			Detail:     "跨服排位战第 14 场取胜，连胜场次达 8 场，天梯积分提升至 2840 (太乙真仙段位)",
			Delta:      "+35 天梯积分",
			IP:         "120.229.40.16",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 16:09:12", dateFromNow(-1)),
		},
		{
			ID:         "GL202610210008",
			Game:       "山海长歌",
			ServerID:   "沧海流云-1服",
			PlayerID:   "XJ100926",
			PlayerName: "一叶知秋",
			Category:   "登录登出",
			Action:     "玩家上线",
			Detail:     "通过 iOS 客户端成功鉴权登录，客户端版本 v2.4.1，延迟 28ms",
			Delta:      "会话建立",
			IP:         "27.154.89.31",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 08:30:00", dateFromNow(-2)),
		},
		{
			ID:         "GL202610210009",
			Game:       "九州志",
			ServerID:   "九州巅峰-2服",
			PlayerID:   "XJ100367",
			PlayerName: "青山客",
			Category:   "经济流水",
			Action:     "寄售行交易",
			Detail:     "上架的 [百年温玉] x20 已被其他玩家竞拍拍下，扣除 5% 手续费后货款到账",
			Delta:      "+1900 元宝",
			IP:         "183.210.45.67",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 14:15:20", dateFromNow(-1)),
		},
		{
			ID:         "GL202610210010",
			Game:       "云间录",
			ServerID:   "全区服",
			PlayerID:   "XJ100512",
			PlayerName: "月照归舟",
			Category:   "角色成长",
			Action:     "自创神通大圆满",
			Detail:     "领悟太极阴阳之道，自创天阶绝技 [九霄引雷诀] 参悟至第 10 重圆满境界",
			Delta:      "+1 天阶神通",
			IP:         "221.192.10.88",
			Level:      "CRITICAL",
			Time:       fmt.Sprintf("%s 11:45:00", dateFromNow(-1)),
		},
		{
			ID:         "GL202610210011",
			Game:       "山海长歌",
			ServerID:   "沧海流云-1服",
			PlayerID:   "XJ100731",
			PlayerName: "长安旧梦",
			Category:   "安全风控",
			Action:     "账号安全封禁",
			Detail:     "依据反外挂判定规则，执行自动化临时封禁 7 天处理",
			Delta:      "账号冻结",
			IP:         "101.89.201.12",
			Level:      "CRITICAL",
			Time:       fmt.Sprintf("%s 18:35:15", dateFromNow(-1)),
		},
		{
			ID:         "GL202610210012",
			Game:       "九州志",
			ServerID:   "九州巅峰-2服",
			PlayerID:   "XJ100248",
			PlayerName: "听风入梦",
			Category:   "道具获取",
			Action:     "秘境探宝掉落",
			Detail:     "单人首通秘境副本 [无极深渊 80 层]，首通掉落极品防具 [玄武盘龙甲]",
			Delta:      "+1 玄武盘龙甲",
			IP:         "114.249.32.18",
			Level:      "INFO",
			Time:       fmt.Sprintf("%s 15:20:18", dateFromNow(-2)),
		},
	}
}

// GetDefaultShopItems returns default in-game mall commodities
func GetDefaultShopItems() []model.ShopItem {
	return []model.ShopItem{
		{
			ID:            "SHOP_1001",
			Name:          "至尊飞升迎新礼匣",
			Game:          "山海长歌",
			Category:      "超值礼包",
			Currency:      "仙玉",
			Price:         68,
			OriginalPrice: 198,
			Stock:         -1,
			BuyLimit:      "永久限购1次",
			Tag:           "首充特惠",
			Description:   "仙途启程必备，内含极品成长法宝与海量飞升修炼灵物，助道友一日千里。",
			Items:         "太虚飞剑 x1, 九转还魂金丹 x5, 极品灵石 x10000",
			Status:        "上架中",
			SortOrder:     1,
			CreatedAt:     dateFromNow(-10),
			UpdatedAt:     dateFromNow(0),
		},
		{
			ID:            "SHOP_1002",
			Name:          "九霄太虚诛仙古剑",
			Game:          "九州志",
			Category:      "极品法宝",
			Currency:      "仙玉",
			Price:         648,
			OriginalPrice: 888,
			Stock:         50,
			BuyLimit:      "永久限购1次",
			Tag:           "镇店之宝",
			Description:   "上古剑仙本命法宝，引九霄雷劫淬炼七七四十九日而成，出鞘自带破甲雷光。",
			Items:         "九霄太虚古剑 (传说) x1",
			Status:        "上架中",
			SortOrder:     2,
			CreatedAt:     dateFromNow(-8),
			UpdatedAt:     dateFromNow(-1),
		},
		{
			ID:            "SHOP_1003",
			Name:          "九转还魂聚气神丹组",
			Game:          "全部游戏",
			Category:      "灵丹妙药",
			Currency:      "元宝",
			Price:         1280,
			OriginalPrice: 1600,
			Stock:         -1,
			BuyLimit:      "每日限购3次",
			Tag:           "突破必备",
			Description:   "炼丹大宗师亲手抟炼，服用后瞬间恢复全部气血灵力，并提升30%破境渡劫概率。",
			Items:         "九转还魂丹 x10, 渡劫聚气散 x5",
			Status:        "上架中",
			SortOrder:     3,
			CreatedAt:     dateFromNow(-15),
			UpdatedAt:     dateFromNow(0),
		},
		{
			ID:            "SHOP_1004",
			Name:          "月度仙缘福禄卡",
			Game:          "全部游戏",
			Category:      "超值礼包",
			Currency:      "CNY",
			Price:         30,
			OriginalPrice: 30,
			Stock:         -1,
			BuyLimit:      "每月限购1次",
			Tag:           "30倍返利",
			Description:   "激活立即获取 300 仙玉，连续 30 日每日登录可领 100 仙玉及天工宝匣钥匙。",
			Items:         "即得 300 仙玉, 每日领 100 仙玉 (累计 3300 仙玉)",
			Status:        "上架中",
			SortOrder:     4,
			CreatedAt:     dateFromNow(-30),
			UpdatedAt:     dateFromNow(0),
		},
		{
			ID:            "SHOP_1005",
			Name:          "广袖流仙幻羽裙",
			Game:          "云间录",
			Category:      "外观时装",
			Currency:      "仙玉",
			Price:         328,
			OriginalPrice: 428,
			Stock:         -1,
			BuyLimit:      "永久限购1次",
			Tag:           "限定外观",
			Description:   "织女采九天云霞纺织而成，着此霓裳步步生莲，踏雪无痕，附带专属登场光效。",
			Items:         "广袖流仙羽衣 x1, 步步生莲光效卡 x1",
			Status:        "上架中",
			SortOrder:     5,
			CreatedAt:     dateFromNow(-5),
			UpdatedAt:     dateFromNow(-1),
		},
		{
			ID:            "SHOP_1006",
			Name:          "天工洗髓神水",
			Game:          "山海长歌",
			Category:      "灵丹妙药",
			Currency:      "灵石",
			Price:         5000,
			OriginalPrice: 6800,
			Stock:         200,
			BuyLimit:      "每周限购5次",
			Tag:           "热销新品",
			Description:   "洗涤周身百骸凡尘经络，可完全重置角色修行潜能点数并返还全部天道功德。",
			Items:         "洗髓神水 x1",
			Status:        "上架中",
			SortOrder:     6,
			CreatedAt:     dateFromNow(-3),
			UpdatedAt:     dateFromNow(0),
		},
		{
			ID:            "SHOP_1007",
			Name:          "太清两仪聚灵阵盘",
			Game:          "九州志",
			Category:      "极品法宝",
			Currency:      "仙玉",
			Price:         298,
			OriginalPrice: 398,
			Stock:         -1,
			BuyLimit:      "不限购",
			Tag:           "限时特惠",
			Description:   "洞府修炼必备法阵，放置于宗门洞府内可令天地灵气浓郁翻倍，挂机修为速度+50%。",
			Items:         "太清两仪阵盘 x1",
			Status:        "已下架",
			SortOrder:     7,
			CreatedAt:     dateFromNow(-20),
			UpdatedAt:     dateFromNow(-5),
		},
		{
			ID:            "SHOP_1008",
			Name:          "6480 仙玉天禄宝匣",
			Game:          "全部游戏",
			Category:      "货币直购",
			Currency:      "CNY",
			Price:         648,
			OriginalPrice: 648,
			Stock:         -1,
			BuyLimit:      "不限购",
			Tag:           "畅销爆款",
			Description:   "仙玉直购特惠包，首充触发双倍赠送 6480 仙玉，非首充额外赠送 1280 绑定元宝。",
			Items:         "6480 仙玉 + 1280 绑定元宝",
			Status:        "上架中",
			SortOrder:     8,
			CreatedAt:     dateFromNow(-40),
			UpdatedAt:     dateFromNow(0),
		},
	}
}
