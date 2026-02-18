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

// Create the API client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// REQUEST INTERCEPTOR: attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set JSON Content-Type if NOT FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    
    // Prevent caching issues
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR: handle 401 (refresh token)
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error("API Error:", error.response?.status, error.message);
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");
        
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