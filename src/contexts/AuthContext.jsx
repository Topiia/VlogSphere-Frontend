import { createContext, useContext, useState, useEffect } from "react";
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
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user on mount
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
        console.error("Auth init failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // Token Auto-Refresh
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await authAPI.refreshToken(refreshToken);
        const { accessToken, refreshToken: newRT } = res.data;

        setToken(accessToken);
        setRefreshToken(newRT);

        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRT);

        authAPI.setAuthHeader(accessToken);
      } catch (err) {
        console.error("Token refresh failed");
        logout();
      }
    }, 25 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshToken]);

  // LOGIN — FIXED (NO BLANK WHITE PAGE)
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await authAPI.login({ email, password, rememberMe });

      const { token: newToken, refreshToken: newRefreshToken, user: userData } = res.data;

      setUser(userData);
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setIsAuthenticated(true);

      if (rememberMe) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
      } else {
        sessionStorage.setItem("token", newToken);
        sessionStorage.setItem("refreshToken", newRefreshToken);
      }

      authAPI.setAuthHeader(newToken);
      toast.success("Welcome back!");

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Incorrect email or password";

      toast.error(message);
      return { success: false, error: message };
    }
  };

  // REGISTER — FIXED (NO TOKEN EXPECTED)
  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);

      if (res.data.success) {
        toast.success(res.data.message || "Account created!");
        return { success: true };
      }

      return { success: false, error: res.data.message };
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Registration failed";

      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    try {
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
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
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
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
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
