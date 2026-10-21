package auth_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"xuanji-backend/internal/auth"
)

func TestAuthManager(t *testing.T) {
	_ = os.Setenv("AUTH_USERNAME", "test_admin")
	_ = os.Setenv("AUTH_PASSWORD", "secret123")

	mgr := auth.NewAuthManager(nil)

	// 1. Test failed login
	_, _, err := mgr.Authenticate("wrong_user", "secret123")
	if err == nil {
		t.Fatal("expected error on invalid username, got nil")
	}

	_, _, err = mgr.Authenticate("test_admin", "wrong_password")
	if err == nil {
		t.Fatal("expected error on invalid password, got nil")
	}

	// 2. Test successful login
	session, token, err := mgr.Authenticate("test_admin", "secret123")
	if err != nil {
		t.Fatalf("unexpected login error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if session.Username != "test_admin" {
		t.Errorf("expected session username test_admin, got %s", session.Username)
	}

	// 3. Test token validation
	valSession, ok := mgr.ValidateToken(token)
	if !ok || valSession == nil {
		t.Fatal("token validation failed for valid token")
	}

	// 4. Test invalid token
	_, ok = mgr.ValidateToken("invalid_fake_token")
	if ok {
		t.Fatal("token validation should have failed for fake token")
	}

	// 5. Test token revocation
	mgr.RevokeToken(token)
	_, ok = mgr.ValidateToken(token)
	if ok {
		t.Fatal("token should be invalid after revocation")
	}
}

func TestAuthMiddleware(t *testing.T) {
	_ = os.Setenv("AUTH_USERNAME", "test_admin")
	_ = os.Setenv("AUTH_PASSWORD", "secret123")

	mgr := auth.NewAuthManager(nil)
	mux := http.NewServeMux()
	mgr.RegisterRoutes(mux)

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("GET /api/protected", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"data":"secret_content"}`))
	})

	handler := mgr.Middleware(mux)

	// 1. Public route /api/health should succeed without auth
	req := httptest.NewRequest("GET", "/api/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/health, got %d", rec.Code)
	}

	// 2. Protected route /api/protected without token should return 401
	req = httptest.NewRequest("GET", "/api/protected", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on /api/protected without token, got %d", rec.Code)
	}

	// 3. Login to get token
	loginBody, _ := json.Marshal(map[string]string{
		"username": "test_admin",
		"password": "secret123",
	})
	req = httptest.NewRequest("POST", "/api/auth/login", bytes.NewReader(loginBody))
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on login, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp auth.LoginResponse
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Token == "" {
		t.Fatal("expected token in login response")
	}

	// 4. Access protected route with Bearer token
	req = httptest.NewRequest("GET", "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer "+resp.Token)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/protected with token, got %d", rec.Code)
	}

	// 5. Access protected route with ?token= query parameter (for CSV download export)
	req = httptest.NewRequest("GET", "/api/protected?token="+resp.Token, nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/protected with query token, got %d", rec.Code)
	}

	// 6. Test GET /api/auth/me
	req = httptest.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+resp.Token)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/auth/me, got %d", rec.Code)
	}
	var me auth.UserSession
	_ = json.NewDecoder(rec.Body).Decode(&me)
	if me.Username != "test_admin" {
		t.Errorf("expected test_admin, got %s", me.Username)
	}

	// 7. Test POST /api/auth/logout
	req = httptest.NewRequest("POST", "/api/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer "+resp.Token)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on logout, got %d", rec.Code)
	}

	// Token should now be rejected
	req = httptest.NewRequest("GET", "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer "+resp.Token)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on /api/protected after logout, got %d", rec.Code)
	}
}
