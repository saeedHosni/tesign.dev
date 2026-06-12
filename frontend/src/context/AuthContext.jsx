// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY   = 'tesign_token';
const REFRESH_KEY = 'tesign_refresh';
const USER_KEY    = 'tesign_user';

// ── helpers ──────────────────────────────────────────────────────────────────

function saveSession(accessToken, refreshToken, user) {
  localStorage.setItem(TOKEN_KEY,   accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY,    JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => loadUser());
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // گوش دادن به رویداد «session منقضی شد» که از api.js fire می‌شود
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      clearSession();
    };
    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, []);

  // تأیید اعتبار توکن ذخیره‌شده هنگام mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(res => {
        const u = res.data || res.user || res;
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        // refresh هم شکست خورد (api.js قبلاً تلاش کرد) — session پاک شود
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const res = await authApi.login({ email, password });
    const { accessToken, refreshToken, user: u } = res.data;
    saveSession(accessToken, refreshToken, u);
    setUser(u);
    return u;
  }, []);

  // ── register ──────────────────────────────────────────────────────────────

  const register = useCallback(async ({ name, email, password }) => {
    setError(null);
    const res = await authApi.register({ name, email, password });
    const { accessToken, refreshToken, user: u } = res.data;
    saveSession(accessToken, refreshToken, u);
    setUser(u);
    return u;
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // silent — در هر صورت client را پاک کن
    }
    clearSession();
    setUser(null);
  }, []);

  // ── refresh profile ───────────────────────────────────────────────────────

  const refreshProfile = useCallback(async () => {
    const res = await authApi.me();
    const u = res.data || res.user || res;
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  }, []);

  // ── role checks ───────────────────────────────────────────────────────────
  // بک‌اند از ADMIN و MANAGER استفاده می‌کند؛ SUPER_ADMIN وجود ندارد
  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isSuperAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      setError,
      isLoggedIn: !!user,
      isAdmin,
      isSuperAdmin,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
