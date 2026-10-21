package gameserver

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMockDriver(t *testing.T) {
	ctx := context.Background()
	driver := NewMockDriver()

	if driver.Name() != "mock" {
		t.Fatalf("expected driver name 'mock', got %s", driver.Name())
	}

	// 1. SendItem
	res, err := driver.SendItem(ctx, SendItemPayload{
		RequestID: "req-1",
		Game:      "王者之战",
		PlayerID:  "P10001",
		ItemName:  "屠龙宝刀",
		Amount:    1,
	})
	if err != nil || !res.Success {
		t.Fatalf("SendItem failed: %v", err)
	}

	// 2. KickPlayer
	res, err = driver.KickPlayer(ctx, KickPlayerPayload{
		RequestID: "req-2",
		Game:      "王者之战",
		PlayerID:  "P10001",
		Reason:    "GM测试",
	})
	if err != nil || !res.Success {
		t.Fatalf("KickPlayer failed: %v", err)
	}

	// 3. SetPlayerStatus
	res, err = driver.SetPlayerStatus(ctx, PlayerStatusPayload{
		RequestID: "req-3",
		Game:      "王者之战",
		PlayerID:  "P10001",
		Status:    "已封禁",
		Reason:    "作弊",
	})
	if err != nil || !res.Success {
		t.Fatalf("SetPlayerStatus failed: %v", err)
	}

	// 4. BroadcastNotice
	res, err = driver.BroadcastNotice(ctx, BroadcastPayload{
		RequestID: "req-4",
		Game:      "王者之战",
		Content:   "全服维护通知",
		Priority:  "紧急",
	})
	if err != nil || !res.Success {
		t.Fatalf("BroadcastNotice failed: %v", err)
	}

	// 5. ExecuteCommand
	res, err = driver.ExecuteCommand(ctx, CommandPayload{
		RequestID: "req-5",
		Game:      "王者之战",
		Command:   "/reload_config",
	})
	if err != nil || !res.Success {
		t.Fatalf("ExecuteCommand failed: %v", err)
	}

	// 6. DispatchMail
	res, err = driver.DispatchMail(ctx, MailPayload{
		RequestID: "req-6",
		Game:      "王者之战",
		MailID:    "M1001",
		Title:     "维护补偿",
	})
	if err != nil || !res.Success {
		t.Fatalf("DispatchMail failed: %v", err)
	}

	// 7. Ping
	pingRes, err := driver.Ping(ctx, "王者之战")
	if err != nil || !pingRes.Success {
		t.Fatalf("Ping failed: %v", err)
	}
}

func TestHttpDriver_BearerAuth(t *testing.T) {
	ctx := context.Background()
	var receivedAuthHeader string
	var receivedBody []byte

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedAuthHeader = r.Header.Get("Authorization")
		receivedBody, _ = io.ReadAll(r.Body)

		if r.URL.Path == "/api/gm/item/send" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"code":0,"msg":"success"}`))
			return
		}
		if r.URL.Path == "/api/gm/ping" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"ok"}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	cfg := DriverConfig{
		DriverType: "http",
		DefaultURL: server.URL,
		AuthType:   "bearer",
		AuthToken:  "test-secret-token-123",
		TimeoutSec: 2,
	}

	driver := NewHttpDriver(cfg)

	// Test SendItem
	res, err := driver.SendItem(ctx, SendItemPayload{
		RequestID: "req-item-1",
		Game:      "测试游戏",
		PlayerID:  "U1001",
		ItemName:  "金币",
		Amount:    500,
	})
	if err != nil {
		t.Fatalf("SendItem returned error: %v", err)
	}
	if !res.Success {
		t.Fatalf("expected success, got %v", res)
	}

	if receivedAuthHeader != "Bearer test-secret-token-123" {
		t.Fatalf("expected 'Bearer test-secret-token-123', got '%s'", receivedAuthHeader)
	}

	var parsedBody map[string]interface{}
	if err := json.Unmarshal(receivedBody, &parsedBody); err != nil {
		t.Fatalf("failed to parse received JSON: %v", err)
	}
	if parsedBody["playerId"] != "U1001" || parsedBody["itemName"] != "金币" {
		t.Fatalf("unexpected body: %v", parsedBody)
	}

	// Test Ping
	pingRes, err := driver.Ping(ctx, "测试游戏")
	if err != nil || !pingRes.Success {
		t.Fatalf("Ping failed: %v", err)
	}
}

func TestHttpDriver_HMACAuth(t *testing.T) {
	ctx := context.Background()
	secret := "my-secret-key-999"
	var receivedSig string
	var receivedTs string
	var receivedBody []byte

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedSig = r.Header.Get("X-Signature")
		receivedTs = r.Header.Get("X-Timestamp")
		receivedBody, _ = io.ReadAll(r.Body)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":0,"msg":"ok"}`))
	}))
	defer server.Close()

	cfg := DriverConfig{
		DriverType: "http",
		DefaultURL: server.URL,
		AuthType:   "hmac_sha256",
		SecretKey:  secret,
		TimeoutSec: 2,
	}

	driver := NewHttpDriver(cfg)

	_, err := driver.KickPlayer(ctx, KickPlayerPayload{
		RequestID: "req-kick-1",
		PlayerID:  "U999",
		Reason:    "违规踢出",
	})
	if err != nil {
		t.Fatalf("KickPlayer returned error: %v", err)
	}

	// Verify HMAC signature manually
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(receivedTs + "\n" + string(receivedBody)))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if receivedSig != expectedSig {
		t.Fatalf("HMAC signature mismatch! expected %s, got %s", expectedSig, receivedSig)
	}
}

func TestHttpDriver_ServerRouting(t *testing.T) {
	ctx := context.Background()
	server1Called := false
	server2Called := false

	s1 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		server1Called = true
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":0}`))
	}))
	defer s1.Close()

	s2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		server2Called = true
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":0}`))
	}))
	defer s2.Close()

	cfg := DriverConfig{
		DriverType: "http",
		DefaultURL: s1.URL,
		ServerNodes: map[string]string{
			"二区-风起云涌": s2.URL,
		},
	}
	driver := NewHttpDriver(cfg)

	// Call default game -> s1
	_, err := driver.BroadcastNotice(ctx, BroadcastPayload{Game: "一区-笑傲江湖", Content: "Hello"})
	if err != nil || !server1Called {
		t.Fatalf("expected s1 to be called")
	}

	// Call mapped game -> s2
	_, err = driver.BroadcastNotice(ctx, BroadcastPayload{Game: "二区-风起云涌", Content: "Hello2"})
	if err != nil || !server2Called {
		t.Fatalf("expected s2 to be called")
	}
}

func TestHttpDriver_ErrorHandling(t *testing.T) {
	ctx := context.Background()

	// 1. Business logic failure (code != 0)
	serverBizError := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":2001,"msg":"玩家当前处于离线状态"}`))
	}))
	defer serverBizError.Close()

	driver := NewHttpDriver(DriverConfig{DefaultURL: serverBizError.URL})
	res, err := driver.KickPlayer(ctx, KickPlayerPayload{PlayerID: "offline-player"})
	if err == nil {
		t.Fatalf("expected error for business error code 2001, got nil")
	}
	if res.Success {
		t.Fatalf("expected res.Success=false")
	}
	if res.Message != "玩家当前处于离线状态" {
		t.Fatalf("unexpected message: %s", res.Message)
	}

	// 2. HTTP 500 server error
	server500 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error":"internal crash"}`))
	}))
	defer server500.Close()

	driver500 := NewHttpDriver(DriverConfig{DefaultURL: server500.URL})
	res500, err := driver500.SendItem(ctx, SendItemPayload{})
	if err == nil {
		t.Fatalf("expected error on HTTP 500, got nil")
	}
	if res500.Success {
		t.Fatalf("expected res.Success=false on 500")
	}
}

func TestHybridDriver_Routing(t *testing.T) {
	ctx := context.Background()
	mockHttp := NewMockDriver()
	mockRedis := NewMockDriver()

	hybrid := NewHybridDriver(mockHttp, mockRedis)
	if hybrid.Name() != "hybrid" {
		t.Fatalf("expected driver name 'hybrid', got %s", hybrid.Name())
	}

	// SendItem -> Directed -> HTTP
	res, err := hybrid.SendItem(ctx, SendItemPayload{ItemName: "Diamond"})
	if err != nil || !res.Success {
		t.Fatalf("hybrid SendItem failed: %v", err)
	}

	// BroadcastNotice -> Cluster-wide -> Redis
	res, err = hybrid.BroadcastNotice(ctx, BroadcastPayload{Content: "Announce"})
	if err != nil || !res.Success {
		t.Fatalf("hybrid BroadcastNotice failed: %v", err)
	}

	// DispatchMail target=all -> Redis
	res, err = hybrid.DispatchMail(ctx, MailPayload{TargetType: "all", Title: "Compensation"})
	if err != nil || !res.Success {
		t.Fatalf("hybrid DispatchMail all failed: %v", err)
	}

	// DispatchMail target=player -> HTTP
	res, err = hybrid.DispatchMail(ctx, MailPayload{TargetType: "player", TargetID: "P101"})
	if err != nil || !res.Success {
		t.Fatalf("hybrid DispatchMail player failed: %v", err)
	}

	// Ping
	pingRes, err := hybrid.Ping(ctx, "王者之战")
	if err != nil || !pingRes.Success {
		t.Fatalf("hybrid Ping failed: %v", err)
	}
}
