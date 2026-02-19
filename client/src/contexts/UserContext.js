// contexts/UserContext.js
import React, { createContext, useState, useContext, useCallback } from "react";
import api from "../services/api";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/teacher/profile");
      setUserProfile(res.data.data);
      setLastUpdated(new Date());
      return res.data.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      const response = await api.patch("/teacher/profile", profileData);
      
      if (response.data.success && response.data.data) {
        setUserProfile(response.data.data);
        setLastUpdated(new Date());
        return { success: true, data: response.data.data };
      }
      return { success: false, message: "Update failed" };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Failed to update profile" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        loading,
        lastUpdated,
        fetchUserProfile,
        updateUserProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
};