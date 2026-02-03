import apiClient from "../api/axiosConfig";
import axios from "axios";
import {
  storeTokens,
  storeUserData,
  setFirstLogin,
  removeTokens,
  removeUserData,
  clearAllStorage,
  getRefreshToken,
} from "../utils/storage";

/**
 * Separate axios instance for refresh token (no interceptors)
 */
const refreshClient = axios.create({
  baseURL: apiClient.defaults.baseURL,
  headers: { "Content-Type": "application/json" },
});

const handleError = (error, defaultMessage = "Request failed") => {
  return error.response?.data?.message || error.message || defaultMessage;
};

export const authService = {
  /* ======================= LOGIN ======================= */
  login: async (userId, password) => {
    try {
      const response = await apiClient.post("/auth/login", {
        userId,
        password,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // Store tokens and user info
      await storeTokens(accessToken, refreshToken);
      await storeUserData(user);

      if (user.isFirstLogin || user.forcePasswordChange) {
        await setFirstLogin(true);
      }

      return {
        success: true,
        data: response.data.data,
        isFirstLogin: user.isFirstLogin || user.forcePasswordChange,
      };
    } catch (error) {
      return { success: false, message: handleError(error, "Login failed") };
    }
  },

  /* ================== CHANGE PASSWORD ================== */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      await setFirstLogin(false);

      return {
        success: true,
        data: response.data.data,
        message: "Password changed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: handleError(error, "Failed to change password"),
      };
    }
  },

  /* ================== REFRESH TOKEN ================== */
  refreshToken: async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return { success: false, message: "No refresh token" };

      const response = await refreshClient.post("/auth/refresh-token", {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await storeTokens(accessToken, newRefreshToken);

      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: handleError(error, "Refresh token failed"),
      };
    }
  },

  /* ======================= LOGOUT ======================= */
  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (_) {
      // ignore errors
    } finally {
      await clearAllStorage();
    }
    return { success: true };
  },

  /* ================== GET CURRENT USER ================== */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");
      await storeUserData(response.data.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: handleError(error, "Failed to fetch user"),
      };
    }
  },

  /* ================== ADMIN ANALYTICS ================== */
  getAdminAnalytics: async () => {
    try {
      const response = await apiClient.get("/admin/analytics");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: handleError(error, "Failed to fetch analytics"),
      };
    }
  },

  /* ======================= VERIFY TOKEN ======================= */
  verifyToken: async () => {
    try {
      const response = await apiClient.get("/auth/verify");
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: handleError(error, "Token invalid") };
    }
  },
};
