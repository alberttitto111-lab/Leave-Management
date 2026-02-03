// src/services/api.js
import axios from "axios";
import { API_BASE_URL, API_TIMEOUT, MESSAGES } from "../utils/constants";
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  removeTokens,
  removeUserData,
} from "../utils/storage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// REQUEST INTERCEPTOR: attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Prevent caching issues
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR: handle 401 (refresh token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token found");

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        await storeTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await removeTokens();
        await removeUserData();
        return Promise.reject(refreshError);
      }
    }

    if (!error.response) {
      error.message = MESSAGES.NETWORK_ERROR;
    }

    if (error.response?.status === 403) {
      error.message = MESSAGES.UNAUTHORIZED;
    }

    return Promise.reject(error);
  },
);

export default api;
