import React, { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../services/authService";
import {
  getUserData,
  getAccessToken,
  isFirstLogin,
  removeTokens,
  removeUserData,
  storeUserData,
} from "../utils/storage";
import { USER_ROLES } from "../utils/constants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [role, setRole] = useState(null);

  // Initialize auth state on app launch
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const resetAuthState = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setRequiresPasswordChange(false);
  };

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const userData = await getUserData();
      const firstLogin = await isFirstLogin();

      if (token && userData) {
        // Verify token validity with backend
        const verifyResult = await authService.verifyToken();
        if (verifyResult.success) {
          setUser(userData);
          setRole(userData.role);
          setIsAuthenticated(true);
          if (firstLogin || userData.forcePasswordChange) {
            setRequiresPasswordChange(true);
          }
        } else {
          // Token is invalid/expired and refresh failed
          await logout();
        }
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId, password) => {
    try {
      setLoading(true);
      const result = await authService.login(userId, password);
      if (result.success) {
        setUser(result.data.user);
        setRole(result.data.user.role);
        setIsAuthenticated(true);
        if (result.isFirstLogin) {
          setRequiresPasswordChange(true);
        }
        return { success: true, isFirstLogin: result.isFirstLogin };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const result = await authService.changePassword(
        currentPassword,
        newPassword,
      );
      if (result.success) {
        setRequiresPasswordChange(false);
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      await removeTokens();
      await removeUserData();
      resetAuthState();
      setLoading(false);
    }
  };

  // New function to refresh user profile
  const refreshUserProfile = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.data);
        setRole(result.data.role);
        await storeUserData(result.data);
        return { success: true, data: result.data };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error("Refresh profile error:", error);
      return { success: false, message: error.message };
    }
  };

  // Helper methods for Role-Based Access Control (RBAC)
  const hasRole = (requiredRoles) => {
    if (!role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(role);
    }
    return role === requiredRoles;
  };

  const isAdmin = () => role === USER_ROLES.ADMIN;
  const isHOD = () => role === USER_ROLES.HOD;
  const isTeacher = () => role === USER_ROLES.TEACHER;
  const isStudent = () => role === USER_ROLES.STUDENT;
  const isStaff = () => role === USER_ROLES.STAFF;

  const value = {
    user,
    role,
    loading,
    isAuthenticated,
    requiresPasswordChange,
    login,
    logout,
    changePassword,
    refreshUserProfile,
    checkAuthStatus,
    hasRole,
    isAdmin,
    isHOD,
    isTeacher,
    isStudent,
    isStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};