package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type contextKey string

const SessionContextKey = contextKey("xuanji_auth_session")

// UserSession represents an active authenticated session
type UserSession struct {
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	Avatar    string    `json:"avatar"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// LoginRequest is the payload for POST /api/auth/login
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse is returned upon successful authentication
type LoginResponse struct {
	Token string       `json:"token"`
	User  *UserSession `json:"user"`
}

type AuthManager struct {
	adminUser string
	adminPass string
	sessions  map[string]*UserSession
	mu        sync.RWMutex
	rdb       *redis.Client
}

// LoadDotEnv loads key-value pairs from .env files into environment variables if not set
func LoadDotEnv(files ...string) {
	for _, f := range files {
		data, err := os.ReadFile(f)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				v = strings.Trim(v, `"'`)
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
		}
	}
}

// NewAuthManager initializes the authentication manager with credentials from environment
func NewAuthManager(rdb *redis.Client) *AuthManager {
	// Look up username with fallbacks
	username := os.Getenv("AUTH_USERNAME")
	if username == "" {
		username = os.Getenv("ADMIN_USERNAME")
	}
	if username == "" {
		username = os.Getenv("ADMIN_USER")
	}
	if username == "" {
		username = "admin"
	}

	// Look up password with fallbacks
	password := os.Getenv("AUTH_PASSWORD")
	if password == "" {
		password = os.Getenv("ADMIN_PASSWORD")
	}
	if password == "" {
		password = os.Getenv("ADMIN_PASS")
	}
	if password == "" {
		password = "xuanji2026"
	}

	log.Printf("[Auth] Initialized authentication manager (Admin user: %s)", username)

	return &AuthManager{
		adminUser: username,
		adminPass: password,
		sessions:  make(map[string]*UserSession),
		rdb:       rdb,
	}
}

// Authenticate verifies the username & password and returns a new session and token
func (m *AuthManager) Authenticate(username, password string) (*UserSession, string, error) {
	// Constant-time comparison to prevent timing attacks
	uMatch := subtle.ConstantTimeCompare([]byte(username), []byte(m.adminUser)) == 1
	pMatch := subtle.ConstantTimeCompare([]byte(password), []byte(m.adminPass)) == 1

	if !uMatch || !pMatch {
		return nil, "", errors.New("账号或密钥错误，请核对后重试")
	}

	// Generate 32-byte secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	now := time.Now()
	session := &UserSession{
		Username:  username,
		Name:      "璇玑掌印官",
		Role:      "admin",
		Avatar:    "璇",
		Title:     "总运营执事 · 全权管理",
		CreatedAt: now,
		ExpiresAt: now.Add(24 * time.Hour), // 24小时有效
	}

	m.mu.Lock()
	m.sessions[token] = session
	m.mu.Unlock()

	// Sync to Redis if available
	if m.rdb != nil {
		if data, err := json.Marshal(session); err == nil {
			_ = m.rdb.Set(context.Background(), "auth:session:"+token, data, 24*time.Hour).Err()
		}
	}

	return session, token, nil
}

// ValidateToken checks if a token is valid and unexpired
func (m *AuthManager) ValidateToken(token string) (*UserSession, bool) {
	if token == "" {
		return nil, false
	}

	m.mu.RLock()
	session, exists := m.sessions[token]
	m.mu.RUnlock()

	if exists {
		if time.Now().After(session.ExpiresAt) {
			m.RevokeToken(token)
			return nil, false
		}
		return session, true
	}

	// Try reading from Redis if not found in local memory
	if m.rdb != nil {
		val, err := m.rdb.Get(context.Background(), "auth:session:"+token).Result()
		if err == nil {
			var rSession UserSession
			if json.Unmarshal([]byte(val), &rSession) == nil {
				if time.Now().Before(rSession.ExpiresAt) {
					// Cache back to local memory
					m.mu.Lock()
					m.sessions[token] = &rSession
					m.mu.Unlock()
					return &rSession, true
				}
			}
		}
	}

	return nil, false
}

// RevokeToken invalidates a session
func (m *AuthManager) RevokeToken(token string) {
	m.mu.Lock()
	delete(m.sessions, token)
	m.mu.Unlock()

	if m.rdb != nil {
		_ = m.rdb.Del(context.Background(), "auth:session:"+token).Err()
	}
}

// ExtractToken retrieves token from Bearer Authorization header or query parameter
func ExtractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return strings.TrimSpace(parts[1])
		}
	}
	// Fallback to ?token=... query param (useful for file exports like CSV downloads)
	if qToken := r.URL.Query().Get("token"); qToken != "" {
		return strings.TrimSpace(qToken)
	}
	return ""
}

// Middleware creates an HTTP middleware that enforces authentication on protected /api/ routes
func (m *AuthManager) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Non-API routes (static files, SPA HTML) are public
		if !strings.HasPrefix(r.URL.Path, "/api/") && r.URL.Path != "/api" {
			next.ServeHTTP(w, r)
			return
		}

		// 2. Preflight OPTIONS requests always pass through
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// 3. Whitelisted public API routes
		publicRoutes := []string{
			"/api/health",
			"/api/auth/login",
		}
		for _, pub := range publicRoutes {
			if r.URL.Path == pub {
				next.ServeHTTP(w, r)
				return
			}
		}

		// 4. Validate Token
		token := ExtractToken(r)
		session, valid := m.ValidateToken(token)
		if !valid {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"error":     "未登录或登录凭证已失效，请重新登录",
				"code":      "UNAUTHORIZED",
				"timestamp": time.Now().Unix(),
			})
			return
		}

		// 5. Inject session into request context
		ctx := context.WithValue(r.Context(), SessionContextKey, session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RegisterRoutes registers auth endpoints (/api/auth/login, /api/auth/me, /api/auth/logout)
func (m *AuthManager) RegisterRoutes(mux *http.ServeMux) {
	// Login
	mux.HandleFunc("POST /api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "无效的登录请求格式"})
			return
		}

		session, token, err := m.Authenticate(req.Username, req.Password)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(LoginResponse{
			Token: token,
			User:  session,
		})
	})

	// Get current user profile
	mux.HandleFunc("GET /api/auth/me", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		token := ExtractToken(r)
		session, valid := m.ValidateToken(token)
		if !valid {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "未登录或登录已过期"})
			return
		}

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(session)
	})

	// Logout
	mux.HandleFunc("POST /api/auth/logout", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		token := ExtractToken(r)
		if token != "" {
			m.RevokeToken(token)
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "已成功退出登录"})
	})
}
