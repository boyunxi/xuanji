import { useState } from "react";
import { Lock, User, ArrowRight, ShieldCheck, KeyRound, Sparkles } from "lucide-react";
import { api } from "../api/client";
import type { UserSession } from "../types";

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("xuanji2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请输入执事令号与访问密钥");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.login({
        username: username.trim(),
        password: password.trim(),
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "登录鉴印未通过，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername("admin");
    setPassword("xuanji2026");
    setError(null);
  };

  return (
    <div className="login-wrapper">
      {/* Ancient ink landscape background decoration */}
      <div className="login-bg-overlay" />

      <div className="login-card">
        {/* Top Brand & Seal */}
        <div className="login-header">
          <div className="login-seal-container">
            <span className="login-seal" title="璇玑印鉴">璇</span>
            <div className="login-brand-text">
              <h2>璇玑 · 运营司</h2>
              <span className="login-brand-subtitle">知微见著 · 运筹有度</span>
            </div>
          </div>
          <p className="login-desc">
            仙侠多端游戏精细化运营管理中枢 · 掌印鉴权入口
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="login-error-alert" role="alert">
            <KeyRound size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">
              <User size={15} />
              <span>执事令号 (Username)</span>
            </label>
            <div className="login-input-box">
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                placeholder="请输入运营账号 (默认: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">
              <Lock size={15} />
              <span>鉴权密钥 (Password)</span>
            </label>
            <div className="login-input-box">
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入鉴权密码 (默认: xuanji2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>鉴印核验中...</span>
              </>
            ) : (
              <>
                <span>签印入座 · 进入中枢</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill & Environment Hint */}
        <div className="login-footer-hints">
          <div className="login-env-tip">
            <ShieldCheck size={14} className="login-tip-icon" />
            <span>密码已固定受保于 <code>.env</code> 环境变量</span>
          </div>

          <button
            type="button"
            className="login-quickfill-button"
            onClick={handleQuickFill}
            title="一键填入 .env 中配置的默认凭据"
          >
            <Sparkles size={13} />
            <span>一键填入测试凭证 (admin / xuanji2026)</span>
          </button>
        </div>
      </div>

      <div className="login-page-footer">
        <span>璇玑游戏运营平台 · 古风雅致排版 · Go 1.26 + React 19 全栈驱动</span>
      </div>
    </div>
  );
}
