import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "./constants";

/* -------------------------------------------------------------------------- */
/*                               Secure Helpers                               */
/* -------------------------------------------------------------------------- */

const secureSet = async (key, value) => {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value ?? "");
    if (Platform.OS === "web") {
      return await AsyncStorage.setItem(key, stringValue);
    }
    return await SecureStore.setItemAsync(key, stringValue);
  } catch (error) {
    console.error(`SecureSet error (${key}):`, error);
  }
};

const secureGet = async (key) => {
  try {
    let value;
    if (Platform.OS === "web") {
      value = await AsyncStorage.getItem(key);
    } else {
      value = await SecureStore.getItemAsync(key);
    }
    // Attempt to parse JSON, fallback to string
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`SecureGet error (${key}):`, error);
    return null;
  }
};

const secureDelete = async (key) => {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.removeItem(key);
    }
    return await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`SecureDelete error (${key}):`, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                              Token Management                               */
/* -------------------------------------------------------------------------- */

export const storeTokens = async (accessToken, refreshToken) => {
  try {
    await secureSet(STORAGE_KEYS.ACCESS_TOKEN, accessToken ?? "");
    await secureSet(STORAGE_KEYS.REFRESH_TOKEN, refreshToken ?? "");
    return true;
  } catch (error) {
    console.error("Error storing tokens:", error);
    return false;
  }
};

export const getAccessToken = async () => secureGet(STORAGE_KEYS.ACCESS_TOKEN);

export const getRefreshToken = async () =>
  secureGet(STORAGE_KEYS.REFRESH_TOKEN);

export const removeTokens = async () => {
  try {
    await secureDelete(STORAGE_KEYS.ACCESS_TOKEN);
    await secureDelete(STORAGE_KEYS.REFRESH_TOKEN);
    return true;
  } catch (error) {
    console.error("Error removing tokens:", error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*                          Async (Non-Sensitive) Data                         */
/* -------------------------------------------------------------------------- */

export const storeData = async (key, value) => {
  try {
    const stringValue = JSON.stringify(value ?? null);
    await AsyncStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    return false;
  }
};

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*                               User Utilities                                */
/* -------------------------------------------------------------------------- */

export const storeUserData = async (userData) =>
  storeData(STORAGE_KEYS.USER_DATA, userData);

export const getUserData = async () => getData(STORAGE_KEYS.USER_DATA);

export const removeUserData = async () => removeData(STORAGE_KEYS.USER_DATA);

/* -------------------------------------------------------------------------- */
/*                              App Preferences                                */
/* -------------------------------------------------------------------------- */

export const setFirstLogin = async (value) =>
  storeData(STORAGE_KEYS.FIRST_LOGIN, value);

export const isFirstLogin = async () => getData(STORAGE_KEYS.FIRST_LOGIN);

export const setBiometricEnabled = async (enabled) =>
  storeData(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);

export const isBiometricEnabled = async () =>
  getData(STORAGE_KEYS.BIOMETRIC_ENABLED);

/* -------------------------------------------------------------------------- */
/*                             Global Logout Cleanup                            */
/* -------------------------------------------------------------------------- */

export const clearAllStorage = async () => {
  try {
    await removeTokens();
    await removeUserData();
    await removeData(STORAGE_KEYS.FIRST_LOGIN);
    await removeData(STORAGE_KEYS.FCM_TOKEN);
    return true;
  } catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
};
