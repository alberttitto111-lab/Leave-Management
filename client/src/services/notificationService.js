import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { storeData, getData, STORAGE_KEYS } from "../utils/storage";
import apiClient from "../api/axiosConfig";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Register for push notifications
  registerForPushNotifications: async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "your-project-id", // Replace with your Expo project ID
        })
      ).data;

      console.log("Push Token:", token);

      // Save token to storage and backend
      await storeData(STORAGE_KEYS.FCM_TOKEN, token);
      await notificationService.saveTokenToBackend(token);
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  },

  // Save token to backend
  saveTokenToBackend: async (token) => {
    try {
      await apiClient.post("/notifications/subscribe", { token });
    } catch (error) {
      console.error("Error saving token:", error);
    }
  },

  // Listen for notifications
  addNotificationListener: (callback) => {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Listen for notification responses (when user taps notification)
  addNotificationResponseListener: (callback) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Schedule local notification
  scheduleNotification: async (title, body, data = {}, trigger = null) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: trigger || { seconds: 1 },
    });
  },

  // Cancel all notifications
  cancelAllNotifications: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Remove token on logout
  removeToken: async () => {
    const token = await getData(STORAGE_KEYS.FCM_TOKEN);
    if (token) {
      try {
        await apiClient.post("/notifications/unsubscribe", { token });
      } catch (error) {
        console.error("Error removing token:", error);
      }
    }
  },
};
