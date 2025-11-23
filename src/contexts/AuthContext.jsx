// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || sessionStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Init auth on mount (if token exists)
  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        authAPI.setAuthHeader(token);
        const res = await authAPI.getMe();
        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth init failed:", err?.response?.data || err);
        // Clear any bad token
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        authAPI.setAuthHeader(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto refresh (best-effort). If refresh fails we logout.
  useEffect(() => {
    if (!refreshToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await authAPI.refreshToken(refreshToken);
        const { accessToken, refreshToken: newRT } = res.data;

        if (accessToken) {
          setToken(accessToken);
          setRefreshToken(newRT);
          localStorage.setItem("token", accessToken);
          localStorage.setItem("refreshToken", newRT);
          authAPI.setAuthHeader(accessToken);
        }
      } catch (err) {
        console.error("Token refresh failed:", err?.response?.data || err);
        // If refresh fails, clear auth
        logout();
      }
    }, 25 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await authAPI.login({ email, password, rememberMe });

      // backend expected shape: { token, refreshToken, user }
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = res.data || {};

      if (!newToken || !newRefreshToken) {
        // Defensive fallback if backend returns a different shape
        const msg = res.data?.message || "Login succeeded but tokens not returned";
        console.warn(msg);
      }

      if (userData) setUser(userData);
      if (newToken) {
        setToken(newToken);
        authAPI.setAuthHeader(newToken);
      }
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);

      // Store tokens by remember preference
      if (newToken && newRefreshToken) {
        if (rememberMe) {
          localStorage.setItem("token", newToken);
          localStorage.setItem("refreshToken", newRefreshToken);
        } else {
          sessionStorage.setItem("token", newToken);
          sessionStorage.setItem("refreshToken", newRefreshToken);
        }
      }

      toast.success("Welcome back!");
      return { success: true };
    } catch (err) {
      // return structured error; do NOT throw to avoid unhandled promise rejections
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Incorrect email or password";

      toast.error(message);
      return { success: false, error: message };
    }
  };

  // REGISTER
  const register = async (userData) => {
    try {
      // backend may return tokens or not - handle both
      const res = await authAPI.register(userData);

      // If backend returns tokens & user, set locally (optional)
      const { token: newToken, refreshToken: newRefreshToken, user: userInfo } = res.data || {};

      if (newToken && newRefreshToken) {
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        authAPI.setAuthHeader(newToken);
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        setIsAuthenticated(true);
        if (userInfo) setUser(userInfo);
      }

      // If backend responded success boolean + message:
      if (res.data?.success) {
        toast.success(res.data.message || "Registration successful");
        return { success: true };
      }

      // Fallback success if HTTP 201 but not shaped as above
      return { success: true };
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Registration failed";

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    try {
      // fire-and-forget server logout (safe)
      authAPI.logout().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");

      authAPI.setAuthHeader(null);
      toast.success("Logged out");
    }
  };

  const updateUser = async (data) => {
    try {
      const res = await authAPI.updateDetails(data);
      setUser(res.data.user);
      toast.success("Profile updated");
      return { success: true };
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Update failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      toast.success("Password updated");
      return { success: true };
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Password update failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
