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

func (s *DataStore) seedDefaultData() {
	s.Games = []model.GameInfo{
		{ID: "all", Name: "全部游戏", DisplayOrder: 0},
		{ID: "shanhai", Name: "山海长歌", DisplayOrder: 1},
		{ID: "jiuzhou", Name: "九州志", DisplayOrder: 2},
		{ID: "yunjian", Name: "云间录", DisplayOrder: 3},
	}

	s.Players = []model.Player{
		{ID: "XJ100248", Name: "听风入梦", Game: "山海长歌", Level: 86, Spend: 3280, LastActive: "今天 10:42", Status: "正常"},
		{ID: "XJ100367", Name: "青山客", Game: "九州志", Level: 72, Spend: 1680, LastActive: "今天 09:18", Status: "正常"},
		{ID: "XJ100512", Name: "月照归舟", Game: "云间录", Level: 64, Spend: 980, LastActive: "今天 08:56", Status: "正常"},
		{ID: "XJ100689", Name: "拾光者", Game: "山海长歌", Level: 91, Spend: 5680, LastActive: "昨天 22:13", Status: "正常"},
		{ID: "XJ100731", Name: "长安旧梦", Game: "九州志", Level: 58, Spend: 320, LastActive: "昨天 18:35", Status: "已封禁"},
		{ID: "XJ100845", Name: "云深不知处", Game: "云间录", Level: 77, Spend: 2580, LastActive: "昨天 16:09", Status: "正常"},
		{ID: "XJ100926", Name: "一叶知秋", Game: "山海长歌", Level: 43, Spend: 128, LastActive: "2天前", Status: "正常"},
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

	s.GMLogs = []model.GMLog{
		{ID: "GM891021", Operator: "林管理员", Action: "发放道具", Target: "山海长歌 · XJ100248", Detail: "发放 元宝 x1000 (原因: 补偿维护延时)", Time: fmt.Sprintf("%s 10:15:20", dateFromNow(0)), Status: "成功"},
		{ID: "GM891018", Operator: "林管理员", Action: "全服广播", Target: "九州志", Detail: "[系统跑马灯] 九州论剑决赛即将开启，请各服少侠做好准备", Time: fmt.Sprintf("%s 09:30:00", dateFromNow(0)), Status: "成功"},
		{ID: "GM891004", Operator: "林管理员", Action: "重载配表", Target: "全服服务器", Detail: "全区服游戏掉落与数值配置表已热重载", Time: fmt.Sprintf("%s 22:00:15", dateFromNow(-1)), Status: "成功"},
	}
}
