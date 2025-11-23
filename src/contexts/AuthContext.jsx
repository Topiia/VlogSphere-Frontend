// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth on mount if token exists
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
        // invalid token -> clear auth
        console.error("Auth init failed:", err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto refresh using refreshToken every ~25 minutes
  useEffect(() => {
    if (!refreshToken) return;
    const id = setInterval(async () => {
      try {
        const res = await authAPI.refreshToken(refreshToken);
        // Expecting backend returns { accessToken, refreshToken } or similar
        const newAccess = res.data.accessToken || res.data.token || res.data.data?.token;
        const newRefresh = res.data.refreshToken || res.data.refresh_token || res.data.data?.refreshToken;

        if (newAccess) {
          setToken(newAccess);
          authAPI.setAuthHeader(newAccess);
          // prefer localStorage if token was stored there earlier
          if (localStorage.getItem("refreshToken") || localStorage.getItem("token")) {
            localStorage.setItem("token", newAccess);
            if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
          } else {
            sessionStorage.setItem("token", newAccess);
            if (newRefresh) sessionStorage.setItem("refreshToken", newRefresh);
          }
          if (newRefresh) setRefreshToken(newRefresh);
        } else {
          throw new Error("Invalid refresh response");
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
        clearAuth();
      }
    }, 25 * 60 * 1000);

    return () => clearInterval(id);
  }, [refreshToken]);

  function clearAuth() {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    authAPI.setAuthHeader(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
  }

  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await authAPI.login({ email, password });
      const newToken = res.data.token || res.data.accessToken || res.data.data?.token;
      const newRefresh = res.data.refreshToken || res.data.refresh_token || res.data.data?.refreshToken;
      const userData = res.data.user || res.data.data?.user;

      if (!newToken) throw new Error("Invalid login response");

      setToken(newToken);
      setRefreshToken(newRefresh || null);
      setUser(userData || null);
      setIsAuthenticated(true);
      authAPI.setAuthHeader(newToken);

      if (rememberMe) {
        localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
      } else {
        sessionStorage.setItem("token", newToken);
        if (newRefresh) sessionStorage.setItem("refreshToken", newRefresh);
      }

      toast.success("Welcome back!");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // REGISTER: backend DOES NOT return tokens consistently on register.
  // So we simply call register and return result; do not auto-login here.
  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      // Expect backend returns { success: true, message: "..."}
      if (res.data && (res.data.success || res.status === 201)) {
        // If backend returns message, show it
        if (res.data.message) toast.success(res.data.message);
        else toast.success("Account created");
        return { success: true };
      } else {
        const msg = res.data?.message || "Registration failed";
        return { success: false, error: msg };
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // best-effort - ignore network failures here
        await authAPI.logout().catch(() => {});
      }
    } finally {
      clearAuth();
      toast.success("Logged out");
    }
  };

  const updateUser = async (data) => {
    try {
      const res = await authAPI.updateDetails(data);
      setUser(res.data.user || res.data.data?.user);
      toast.success("Profile updated");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Update failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      toast.success("Password updated");
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Password update failed";
      toast.error(message);
      return { success: false, error: message };
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
        setUser, // optional: useful for client-side updates
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
