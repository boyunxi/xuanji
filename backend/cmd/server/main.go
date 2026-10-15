package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"xuanji-backend/internal/handler"
	"xuanji-backend/internal/store"
)

// corsMiddleware adds CORS headers and handles preflight requests
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// spaHandler serves frontend static files or index.html for SPA routing
func spaHandler(staticDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't intercept /api/
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		filePath := filepath.Join(staticDir, filepath.Clean(r.URL.Path))
		info, err := os.Stat(filePath)
		if err == nil && !info.IsDir() {
			http.ServeFile(w, r, filePath)
			return
		}

		// Fallback to index.html for client-side routing
		indexFile := filepath.Join(staticDir, "index.html")
		if _, err := os.Stat(indexFile); err == nil {
			http.ServeFile(w, r, indexFile)
			return
		}

		http.NotFound(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}

	ds, err := store.NewDataStore(dataDir)
	if err != nil {
		log.Fatalf("❌ 无法初始化数据存储: %v", err)
	}

	mux := http.NewServeMux()
	apiHandler := handler.NewAPIHandler(ds)
	apiHandler.RegisterRoutes(mux)

	// Check if frontend build exists
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		candidates := []string{
			"./dist",
			"./frontend/dist",
			"../frontend/dist",
			"../../frontend/dist",
		}
		for _, cand := range candidates {
			if info, err := os.Stat(cand); err == nil && info.IsDir() {
				staticDir = cand
				break
			}
		}
	}

	var rootHandler http.Handler = mux
	if staticDir != "" {
		log.Printf("📦 静态资源目录: %s", staticDir)
		spa := spaHandler(staticDir)
		rootHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				mux.ServeHTTP(w, r)
				return
			}
			spa.ServeHTTP(w, r)
		})
	}

	handlerWithCORS := corsMiddleware(rootHandler)

	fmt.Println("=====================================================")
	fmt.Println("      璇 玑 · 游 戏 运 营 后 台 (Xuanji Operations)       ")
	fmt.Println("=====================================================")
	fmt.Printf(" [Go 后端服务] 启动成功，监听端口: http://127.0.0.1:%s\n", port)
	fmt.Println(" - API 健康检查: http://127.0.0.1:8080/api/health")
	fmt.Println(" - 运营总览接口: http://127.0.0.1:8080/api/overview")
	fmt.Println(" - 玩家管理接口: http://127.0.0.1:8080/api/players")
	fmt.Println(" - 活动管理接口: http://127.0.0.1:8080/api/events")
	fmt.Println(" - 充值订单接口: http://127.0.0.1:8080/api/orders")
	fmt.Println("=====================================================")

	if err := http.ListenAndServe(":"+port, handlerWithCORS); err != nil {
		log.Fatalf("❌ 服务启动失败: %v", err)
	}
}
