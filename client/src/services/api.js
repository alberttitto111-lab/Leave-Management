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
  // --- REMOVE THIS DEFAULT HEADERS BLOCK OR MODIFY IT ---
  // Default headers are applied to all requests, including file uploads
  /* headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  */
});

// REQUEST INTERCEPTOR: attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // --- FIX: Only set JSON Content-Type if NOT FormData ---
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    // -----------------------------------------------------

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
    // ... (rest of your response interceptor code is fine)
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ...
    }
    return Promise.reject(error);
  },
);

export default api;
