package store

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"xuanji-backend/internal/model"
)

// --- Notices ---

func (s *DataStore) GetNotices() []model.Notice {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]model.Notice, len(s.Notices))
	copy(res, s.Notices)
	return res
}

func (s *DataStore) MarkNoticeRead(id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Notices {
		if s.Notices[i].ID == id {
			s.Notices[i].Read = true
			_ = s.saveUnlocked()
			if s.db != nil {
				_, _ = s.db.Exec("UPDATE notices SET read=true WHERE id=$1", id)
			}
			return true
		}
	}
	return false
}

func (s *DataStore) MarkAllNoticesRead() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.Notices {
		s.Notices[i].Read = true
	}
	_ = s.saveUnlocked()
	if s.db != nil {
		_, _ = s.db.Exec("UPDATE notices SET read=true")
	}
}

// --- Settings ---

func (s *DataStore) GetSettings() model.Settings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Settings
}

func (s *DataStore) UpdateSettings(st model.Settings) (model.Settings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.Settings = st
	_ = s.saveUnlocked()
	if s.db != nil {
		_, _ = s.db.Exec("UPDATE settings SET daily=$1, orders=$2, events=$3 WHERE key='default'",
			st.Daily, st.Orders, st.Events)
	}
	return s.Settings, nil
}

// --- Overview Calculation Helpers ---

func getGameFactor(game string) float64 {
	switch game {
	case "山海长歌":
		return 0.48
	case "九州志":
		return 0.32
	case "云间录":
		return 0.20
	default:
		return 1.0
	}
}

func formatNumber(val float64) string {
	return addCommas(int64(math.Round(val)))
}

func formatMoney(val float64) string {
	return fmt.Sprintf("¥%s", addCommas(int64(math.Round(val))))
}

func addCommas(n int64) string {
	in := fmt.Sprintf("%d", n)
	out := make([]byte, 0, len(in)+(len(in)-1)/3)
	for i, c := range in {
		if i > 0 && (len(in)-i)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, byte(c))
	}
	return string(out)
}

func ifThen(cond bool, a, b string) string {
	if cond {
		return a
	}
	return b
}

// --- Overview & Metrics Analytics ---

func (s *DataStore) GetOverview(game, rangeKey string) model.OverviewResponse {
	if rangeKey == "" {
		rangeKey = "week"
	}

	cacheKey := fmt.Sprintf("xuanji:overview:%s:%s", game, rangeKey)
	if s.rdb != nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if cached, err := s.rdb.Get(ctx, cacheKey).Result(); err == nil {
			var resp model.OverviewResponse
			if err := json.Unmarshal([]byte(cached), &resp); err == nil {
				return resp
			}
		}
	}

	s.mu.RLock()
	factor := getGameFactor(game)

	type BaseData struct {
		Active     float64
		NewPlayers float64
		Revenue    float64
		Retention  float64
	}

	baseMap := map[string]BaseData{
		"today": {Active: 128460, NewPlayers: 8642, Revenue: 326800, Retention: 42.8},
		"week":  {Active: 115820, NewPlayers: 58640, Revenue: 2187600, Retention: 43.6},
		"month": {Active: 108760, NewPlayers: 233420, Revenue: 8964200, Retention: 44.1},
	}
	base := baseMap[rangeKey]

	retentionAdj := 0.0
	switch game {
	case "山海长歌":
		retentionAdj = 1.2
	case "九州志":
		retentionAdj = -0.8
	case "云间录":
		retentionAdj = 0.4
	}

	metrics := []model.MetricItem{
		{
			Label:  ifThen(rangeKey == "today", "活跃玩家", "日均活跃"),
			Value:  formatNumber(base.Active * factor),
			Unit:   "人",
			Change: "+12.8%",
			Up:     true,
		},
		{
			Label:  "新增玩家",
			Value:  formatNumber(base.NewPlayers * factor),
			Unit:   "人",
			Change: "+8.2%",
			Up:     true,
		},
		{
			Label:  "总流水",
			Value:  formatMoney(base.Revenue * factor),
			Unit:   "元",
			Change: "+15.4%",
			Up:     true,
		},
		{
			Label:  "次留存率",
			Value:  fmt.Sprintf("%.1f%%", base.Retention+retentionAdj),
			Unit:   "",
			Change: "-0.6%",
			Up:     false,
		},
	}

	trendDays := 7
	if rangeKey == "month" {
		trendDays = 14
	} else if rangeKey == "today" {
		trendDays = 6
	}

	var labels []string
	var values []float64
	maxVal := 0.0

	for i := trendDays - 1; i >= 0; i-- {
		var l string
		if rangeKey == "today" {
			l = fmt.Sprintf("%02d:00", (24-i*4)%24)
		} else {
			d := time.Now().AddDate(0, 0, -i)
			l = fmt.Sprintf("%d/%d", d.Month(), d.Day())
		}
		labels = append(labels, l)

		noise := math.Sin(float64(i)*1.3)*0.18 + 1.0
		dailyRev := (base.Revenue / float64(trendDays)) * factor * noise
		if dailyRev < 1000 {
			dailyRev = 1000
		}
		values = append(values, math.Round(dailyRev))
		if dailyRev > maxVal {
			maxVal = dailyRev
		}
	}

	trend := model.TrendData{
		Labels: labels,
		Values: values,
		Max:    maxVal * 1.15,
	}

	var revenueParts []model.RevenuePart
	totalRev := base.Revenue * factor

	if game == "" || game == "全部游戏" {
		revenueParts = []model.RevenuePart{
			{Name: "山海长歌", Percent: 48, Color: "#4b7c6f", Amount: math.Round(totalRev * 0.48)},
			{Name: "九州志", Percent: 32, Color: "#b89568", Amount: math.Round(totalRev * 0.32)},
			{Name: "云间录", Percent: 20, Color: "#a67362", Amount: math.Round(totalRev * 0.20)},
		}
	} else {
		revenueParts = []model.RevenuePart{
			{Name: "直接充值", Percent: 54, Color: "#4b7c6f", Amount: math.Round(totalRev * 0.54)},
			{Name: "月卡特权", Percent: 28, Color: "#b89568", Amount: math.Round(totalRev * 0.28)},
			{Name: "限时礼包", Percent: 18, Color: "#a67362", Amount: math.Round(totalRev * 0.18)},
		}
	}

	pendingOrdersCount := 0
	for _, o := range s.Orders {
		if o.Status == "处理中" && (game == "" || game == "全部游戏" || o.Game == game) {
			pendingOrdersCount++
		}
	}

	pendingEventsCount := 0
	for _, e := range s.Events {
		if e.Status == "未开始" && (game == "" || game == "全部游戏" || e.Game == game) {
			pendingEventsCount++
		}
	}

	draftAnnCount := 0
	for _, a := range s.Announcements {
		if a.Status == "草稿" && (game == "" || game == "全部游戏" || a.Game == game) {
			draftAnnCount++
		}
	}

	todos := []model.TodoItem{
		{
			Index:    "01",
			Title:    fmt.Sprintf("待处理充值异常订单 (%d笔)", pendingOrdersCount),
			Subtitle: "部分大额充值订单待财务人工复核确认",
			Action:   "去处理",
			Page:     "orders",
		},
		{
			Index:    "02",
			Title:    fmt.Sprintf("待上线运营活动检查 (%d个)", pendingEventsCount),
			Subtitle: "检查新活动配表、投放产出及白名单测试",
			Action:   "去检查",
			Page:     "events",
		},
		{
			Index:    "03",
			Title:    fmt.Sprintf("全服公告草稿发布审核 (%d篇)", draftAnnCount),
			Subtitle: "运营草拟停机维护与活动前瞻公告待审批",
			Action:   "去发布",
			Page:     "announcements",
		},
	}

	activities := []model.ActivityItem{
		{
			Title:    "发布了新全服公告「版本更新说明」",
			Subtitle: "运营团队 · 系统公告",
			Time:     "10分钟前",
			Page:     "announcements",
		},
		{
			Title:    "创建了新活动「春山有信」",
			Subtitle: "活动运营 · 山海长歌",
			Time:     "45分钟前",
			Page:     "events",
		},
		{
			Title:    "封禁了违规外挂账号 XJ100731",
			Subtitle: "安全风控 · 永久封禁",
			Time:     "2小时前",
			Page:     "players",
		},
		{
			Title:    "成功结算大额订单 XC260408",
			Subtitle: "充值流水 · ¥648.00",
			Time:     "3小时前",
			Page:     "orders",
		},
	}

	s.mu.RUnlock()

	resp := model.OverviewResponse{
		Metrics:      metrics,
		Trend:        trend,
		RevenueParts: revenueParts,
		TotalRevenue: totalRev,
		Todos:        todos,
		Activities:   activities,
	}

	if s.rdb != nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		data, _ := json.Marshal(resp)
		_ = s.rdb.Set(ctx, cacheKey, string(data), 60*time.Second).Err()
	}

	return resp
}

// --- Global Search ---

func (s *DataStore) Search(query string) []model.SearchResultItem {
	return s.GlobalSearch(query)
}

func (s *DataStore) GlobalSearch(query string) []model.SearchResultItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	query = strings.ToLower(strings.TrimSpace(query))
	var results []model.SearchResultItem

	modules := []struct {
		Title    string
		Subtitle string
		Page     string
	}{
		{"运营总览", "工作台", "overview"},
		{"玩家名册", "运营管理", "players"},
		{"邮件补偿", "运营管理", "mails"},
		{"兑换码", "运营管理", "cdkeys"},
		{"运营活动", "运营管理", "events"},
		{"全服公告", "运营管理", "announcements"},
		{"GM运维工具", "运营管理", "gm"},
		{"充值订单", "数据中心", "orders"},
		{"数据报表", "数据中心", "reports"},
		{"系统设置", "系统", "settings"},
	}

	for _, m := range modules {
		if query == "" || strings.Contains(strings.ToLower(m.Title), query) || strings.Contains(strings.ToLower(m.Subtitle), query) {
			results = append(results, model.SearchResultItem{
				Title:    m.Title,
				Subtitle: m.Subtitle,
				Page:     m.Page,
				Type:     "module",
			})
		}
	}

	if query == "" {
		return results
	}

	for _, p := range s.Players {
		if strings.Contains(strings.ToLower(p.Name+p.ID), query) {
			results = append(results, model.SearchResultItem{
				Title:    p.Name,
				Subtitle: fmt.Sprintf("玩家 · %s", p.ID),
				Page:     "players",
				Type:     "player",
				ID:       p.ID,
				Detail:   p,
			})
		}
	}

	for _, e := range s.Events {
		if strings.Contains(strings.ToLower(e.Title+e.ID), query) {
			results = append(results, model.SearchResultItem{
				Title:    e.Title,
				Subtitle: fmt.Sprintf("活动 · %s", e.Game),
				Page:     "events",
				Type:     "event",
				ID:       e.ID,
				Detail:   e,
			})
		}
	}

	for _, ml := range s.Mails {
		if strings.Contains(strings.ToLower(ml.Title+ml.ID+ml.Content), query) {
			results = append(results, model.SearchResultItem{
				Title:    ml.Title,
				Subtitle: fmt.Sprintf("邮件 · %s", ml.Game),
				Page:     "mails",
				Type:     "mail",
				ID:       ml.ID,
				Detail:   ml,
			})
		}
	}

	for _, cdk := range s.CDKeyBatches {
		if strings.Contains(strings.ToLower(cdk.Name+cdk.Code+cdk.ID+cdk.Description), query) {
			sub := fmt.Sprintf("兑换码 · %s", cdk.Game)
			if cdk.Type == model.CDKeyTypeUniversal {
				sub = fmt.Sprintf("通用码 [%s] · %s", cdk.Code, cdk.Game)
			}
			results = append(results, model.SearchResultItem{
				Title:    cdk.Name,
				Subtitle: sub,
				Page:     "cdkeys",
				Type:     "cdkey",
				ID:       cdk.ID,
				Detail:   cdk,
			})
		}
	}

	if len(results) > 9 {
		results = results[:9]
	}
	return results
}
