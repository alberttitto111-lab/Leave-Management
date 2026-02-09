import admin from "../config/firebase.js";
import User from "../models/User.js";

/**
 * Send Push Notification to a specific user
 * @param {string} userId - The ID of the recipient user
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export const sendNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId).select("fcmToken");

    if (!user || !user.fcmToken) {
      console.log(`No FCM Token found for user ${userId}`);
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: user.fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

/**
 * Send Push Notification to multiple users
 * @param {Array<string>} userIds - Array of recipient user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export const sendMulticastNotification = async (
  userIds,
  title,
  body,
  data = {},
) => {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select("fcmToken");
    const tokens = users.map((u) => u.fcmToken).filter((t) => t);

    if (tokens.length === 0) {
      console.log("No valid FCM tokens found for recipients.");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);
    return response;
  } catch (error) {
    console.error("Error sending multicast notification:", error);
  }
};
