import axios from "axios";
import { API_BASE_URL, API_TIMEOUT, MESSAGES } from "../utils/constants";
import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  removeTokens,
  removeUserData,
} from "../utils/storage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refreshToken,
          },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        await storeTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await removeTokens();
        await removeUserData();
        // Removed navigate() call to break the cycle
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

export default apiClient;
