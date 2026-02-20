// contexts/HodContext.js
import React, { createContext, useState, useContext, useCallback } from "react";
import api from "../services/api";

const HodContext = createContext();

export const useHod = () => {
  const context = useContext(HodContext);
  if (!context) {
    throw new Error("useHod must be used within a HodProvider");
  }
  return context;
};

export const HodProvider = ({ children }) => {
  const [hodProfile, setHodProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    pendingHodApprovals: 0,
    approvedByHod: 0,
    rejectedByHod: 0, 
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [departmentName, setDepartmentName] = useState("");

  // Fetch HOD profile
  const fetchHodProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/hod/profile");
      const data = res.data.data;
      
      setHodProfile(data);
      
      // Extract department name
      const hodInfo = data.hodInfo || {};
      if (hodInfo.managedDepartments && hodInfo.managedDepartments.length > 0) {
        if (hodInfo.managedDepartments[0]?.name) {
          setDepartmentName(hodInfo.managedDepartments[0].name);
        }
      } else if (data.departmentId?.name) {
        setDepartmentName(data.departmentId.name);
      }
      
      setLastUpdated(new Date());
      return data;
    } catch (error) {
      console.error("Error fetching HOD profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
  try {
    const res = await api.get("/hod/analytics");
    const data = res.data.data || {};
    
    // Also fetch rejected leaves count
    let rejectedCount = 0;
    try {
      const historyRes = await api.get("/hod/history");
      if (historyRes.data.success) {
        const history = historyRes.data.data || [];
        rejectedCount = history.filter(leave => 
          leave.status === "rejected_by_hod" || leave.finalStatus === "rejected"
        ).length;
      }
    } catch (err) {
      console.error("Error fetching rejected leaves:", err);
    }
    
    setStats({
      totalTeachers: data.stats?.totalTeachers || 0,
      totalStudents: data.stats?.totalStudents || 0,
      pendingHodApprovals: data.stats?.pendingHodApprovals || 0,
      approvedByHod: data.stats?.approvedByHod || 0,
      rejectedByHod: rejectedCount, // Set rejected count
    });
    
    setRecentActivity(data.recentActivity || []);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }
}, []);

  // Fetch department info
  const fetchDepartmentInfo = useCallback(async () => {
    try {
      const res = await api.get("/hod/department-info");
      if (res.data.success && res.data.data.departmentName) {
        setDepartmentName(res.data.data.departmentName);
      }
    } catch (error) {
      console.error("Error fetching department info:", error);
    }
  }, []);

  // Update HOD profile
  const updateHodProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      const response = await api.patch("/hod/profile", profileData);
      
      if (response.data.success && response.data.data) {
        setHodProfile(response.data.data);
        
        // Update department name if changed
        const hodInfo = response.data.data.hodInfo || {};
        if (hodInfo.managedDepartments && hodInfo.managedDepartments.length > 0) {
          if (hodInfo.managedDepartments[0]?.name) {
            setDepartmentName(hodInfo.managedDepartments[0].name);
          }
        } else if (response.data.data.departmentId?.name) {
          setDepartmentName(response.data.data.departmentId.name);
        }
        
        setLastUpdated(new Date());
        return { success: true, data: response.data.data };
      }
      return { success: false, message: "Update failed" };
    } catch (error) {
      console.error("Error updating HOD profile:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Failed to update profile" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchHodProfile(),
      fetchDashboardStats(),
      fetchDepartmentInfo(),
    ]);
  }, [fetchHodProfile, fetchDashboardStats, fetchDepartmentInfo]);

  return (
    <HodContext.Provider
      value={{
        hodProfile,
        loading,
        lastUpdated,
        stats,
        recentActivity,
        departmentName,
        fetchHodProfile,
        fetchDashboardStats,
        fetchDepartmentInfo,
        updateHodProfile,
        refreshAllData,
      }}
    >
      {children}
    </HodContext.Provider>
  );
};