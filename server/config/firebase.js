import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Ensure you have valid credentials in your .env file
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// OR a path to serviceAccountKey.json: GOOGLE_APPLICATION_CREDENTIALS

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin Initialized");
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error.message);
  }
}

export default admin;
