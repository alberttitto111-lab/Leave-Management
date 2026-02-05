// API Configuration
export const API_BASE_URL = "http://192.168.1.13:5000/api"; // Change to your backend URL
export const API_TIMEOUT = 30000;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  FIRST_LOGIN: "first_login",
  BIOMETRIC_ENABLED: "biometric_enabled",
  FCM_TOKEN: "fcm_token",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  HOD: "hod",
  TEACHER: "teacher",
  STUDENT: "student",
  STAFF: "staff",
};

// Colors (Design System)
export const COLORS = {
  // Primary
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  primaryDark: "#1D4ED8",

  // Semantic
  success: "#10B981",
  successLight: "#6EE7B7",
  warning: "#F59E0B",
  warningLight: "#FCD34D",
  danger: "#EF4444",
  dangerLight: "#FCA5A5",
  info: "#3B82F6",

  // Neutral
  slate: "#64748B",
  slateLight: "#94A3B8",
  slateDark: "#475569",
  gray: "#9CA3AF",
  grayLight: "#D1D5DB",
  white: "#FFFFFF",
  black: "#000000",

  // Backgrounds
  background: "#F1F5F9",
  card: "#FFFFFF",
  input: "#F8FAFC",

  // Role-based accents
  admin: "#8B5CF6", // Purple
  hod: "#6366F1", // Indigo
  teacher: "#14B8A6", // Teal
  student: "#2563EB", // Blue
};

// Role Colors Map
export const ROLE_COLORS = {
  [USER_ROLES.ADMIN]: COLORS.admin,
  [USER_ROLES.HOD]: COLORS.hod,
  [USER_ROLES.TEACHER]: COLORS.teacher,
  [USER_ROLES.STUDENT]: COLORS.student,
  [USER_ROLES.STAFF]: COLORS.teacher,
};

// Leave Status
export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  ESCALATED: "escalated",
};

// Approval Actions
export const APPROVAL_ACTIONS = {
  APPROVE: "approved",
  REJECT: "rejected",
  ESCALATE: "escalated",
};

// Navigation Routes
export const ROUTES = {
  // Auth
  LOGIN: "Login",
  CHANGE_PASSWORD: "ChangePassword",

  // Main App
  DASHBOARD: "Dashboard",
  LEAVES: "Leaves",
  APPROVALS: "Approvals",
  PROFILE: "Profile",

  // Dashboard specific
  ADMIN_DASHBOARD: "AdminDashboard",
  HOD_DASHBOARD: "HODDashboard",
  TEACHER_DASHBOARD: "TeacherDashboard",
  STUDENT_DASHBOARD: "StudentDashboard",
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USER_ID: /^[A-Za-z0-9_-]{4,20}$/,
};

// Messages
export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Welcome back!",
  LOGIN_ERROR: "Invalid credentials. Please try again.",
  PASSWORD_CHANGED: "Password changed successfully. Please login again.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, number and special character.",

  // Network
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",

  // Validation
  REQUIRED_FIELD: "This field is required",
  INVALID_EMAIL: "Please enter a valid email",
  INVALID_PHONE: "Please enter a valid 10-digit phone number",

  // General
  SESSION_EXPIRED: "Session expired. Please login again.",
  UNAUTHORIZED: "Unauthorized access.",
  COMING_SOON: "This feature is coming soon!",
};
