package handler_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"xuanji-backend/internal/handler"
	"xuanji-backend/internal/model"
	"xuanji-backend/internal/store"
)

func setupTestServer(t *testing.T) (*httptest.Server, *store.DataStore, func()) {
	tempDir, err := os.MkdirTemp("", "xuanji_api_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	ds, err := store.NewDataStore(tempDir)
	if err != nil {
		t.Fatalf("failed to init store: %v", err)
	}

	mux := http.NewServeMux()
	h := handler.NewAPIHandler(ds)
	h.RegisterRoutes(mux)

	ts := httptest.NewServer(mux)

	cleanup := func() {
		ts.Close()
		os.RemoveAll(tempDir)
	}
	return ts, ds, cleanup
}

func TestAPIEndpoints(t *testing.T) {
	ts, _, cleanup := setupTestServer(t)
	defer cleanup()

	client := ts.Client()

	// 1. Health
	resp, err := client.Get(ts.URL + "/api/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("health check failed: %v, code: %d", err, resp.StatusCode)
	}
	var health map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&health)
	if health["status"] != "ok" {
		t.Errorf("unexpected health: %+v", health)
	}
	resp.Body.Close()

	// 2. Overview
	resp, err = client.Get(ts.URL + "/api/overview?range=week&game=全部游戏")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("overview failed: %v, code: %d", err, resp.StatusCode)
	}
	var overview model.OverviewResponse
	_ = json.NewDecoder(resp.Body).Decode(&overview)
	if len(overview.Metrics) != 4 {
		t.Errorf("expected 4 metrics, got %d", len(overview.Metrics))
	}
	resp.Body.Close()

	// 3. Players
	resp, err = client.Get(ts.URL + "/api/players")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("players failed: %v, code: %d", err, resp.StatusCode)
	}
	var players []model.Player
	_ = json.NewDecoder(resp.Body).Decode(&players)
	if len(players) == 0 {
		t.Errorf("expected players, got none")
	}
	resp.Body.Close()

	// 4. Update player status
	pID := players[0].ID
	patchBody, _ := json.Marshal(map[string]string{"status": "已封禁"})
	req, _ := http.NewRequest(http.MethodPatch, ts.URL+"/api/players/"+pID+"/status", bytes.NewReader(patchBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("patch player status failed: %v, code: %d", err, resp.StatusCode)
	}
	resp.Body.Close()

	// 5. Create Event
	createEventBody, _ := json.Marshal(map[string]string{
		"title": "中秋灯会活动",
		"game":  "山海长歌",
		"start": "2026-10-18",
	})
	resp, err = client.Post(ts.URL+"/api/events", "application/json", bytes.NewReader(createEventBody))
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("create event failed: %v, code: %d", err, resp.StatusCode)
	}
	var createdEvent model.Event
	_ = json.NewDecoder(resp.Body).Decode(&createdEvent)
	if createdEvent.Title != "中秋灯会活动" {
		t.Errorf("expected event title 中秋灯会活动, got %s", createdEvent.Title)
	}
	resp.Body.Close()

	// 6. Orders export CSV
	resp, err = client.Get(ts.URL + "/api/orders/export")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("orders export failed: %v, code: %d", err, resp.StatusCode)
	}
	csvBytes, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if !bytes.Contains(csvBytes, []byte("订单编号")) {
		t.Errorf("expected CSV header 订单编号 in export")
	}

	// 7. Search
	resp, err = client.Get(ts.URL + "/api/search?q=中秋灯会")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("search failed: %v, code: %d", err, resp.StatusCode)
	}
	var searchResults []model.SearchResultItem
	_ = json.NewDecoder(resp.Body).Decode(&searchResults)
	if len(searchResults) == 0 {
		t.Errorf("expected search result for 中秋灯会")
	}
	resp.Body.Close()

	// 8. GM Send Item
	gmItemBody, _ := json.Marshal(model.GMItemRequest{
		Game:     "山海长歌",
		PlayerID: "XJ100248",
		ItemName: "太虚灵石",
		Amount:   500,
		Reason:   "单元测试发放",
	})
	resp, err = client.Post(ts.URL+"/api/gm/item", "application/json", bytes.NewReader(gmItemBody))
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("gm item dispatch failed: %v, code: %d", err, resp.StatusCode)
	}
	var gmLog model.GMLog
	_ = json.NewDecoder(resp.Body).Decode(&gmLog)
	if gmLog.Action != "发放道具" {
		t.Errorf("expected GM action 发放道具, got %s", gmLog.Action)
	}
	resp.Body.Close()

	// 9. GM Logs list
	resp, err = client.Get(ts.URL + "/api/gm/logs")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("gm logs list failed: %v, code: %d", err, resp.StatusCode)
	}
	var logs []model.GMLog
	_ = json.NewDecoder(resp.Body).Decode(&logs)
	if len(logs) == 0 {
		t.Errorf("expected at least 1 GM log, got none")
	}
	resp.Body.Close()

	// 10. Game Server Status
	resp, err = client.Get(ts.URL + "/api/gameserver/status")
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("gameserver status failed: %v, code: %d", err, resp.StatusCode)
	}
	var gsStatus map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&gsStatus)
	if gsStatus["driver"] == "" {
		t.Errorf("expected driver name in gameserver status, got empty")
	}
	resp.Body.Close()

	// 11. Game Server Ping
	pingBody, _ := json.Marshal(map[string]string{"game": "山海长歌"})
	resp, err = client.Post(ts.URL+"/api/gameserver/ping", "application/json", bytes.NewReader(pingBody))
	if err != nil || resp.StatusCode != http.StatusOK {
		t.Fatalf("gameserver ping failed: %v, code: %d", err, resp.StatusCode)
	}
	var pingResult map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&pingResult)
	if pingResult["success"] != true {
		t.Errorf("expected ping success=true, got %+v", pingResult)
	}
	resp.Body.Close()
}

