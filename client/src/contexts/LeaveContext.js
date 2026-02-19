// contexts/LeaveContext.js
import React, { createContext, useState, useContext, useCallback } from "react";
import api from "../services/api";

const LeaveContext = createContext();

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error("useLeave must be used within a LeaveProvider");
  }
  return context;
};

export const LeaveProvider = ({ children }) => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [rejectedLeaves, setRejectedLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAllLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/teacher/leaves/all-with-counts");
      const data = res.data;
      
      const allLeavesData = data.data || [];
      
      // Separate leaves by status
      const pending = allLeavesData.filter(leave => leave.status === "pending");
      const approvedByTeacher = allLeavesData.filter(leave => leave.status === "approved_by_teacher");
      const approved = allLeavesData.filter(leave => 
        leave.status === "approved" || 
        leave.status === "approved_by_hod" || 
        leave.finalStatus === "approved"
      );
      const rejected = allLeavesData.filter(leave => 
        leave.status === "rejected" || leave.finalStatus === "rejected"
      );
      
      // Sort by date (newest first)
      const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      
      setAllLeaves(allLeavesData);
      setPendingLeaves(pending.sort(sortByDate));
      setApprovedLeaves(approvedByTeacher.sort(sortByDate));
      setRejectedLeaves(rejected.sort(sortByDate));
      
      setStats({
        pending: pending.length,
        approved: approvedByTeacher.length,
        rejected: rejected.length,
        total: allLeavesData.length
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveLeave = useCallback(async (leaveId, remarks = "Approved by teacher") => {
    try {
      setLoading(true);
      await api.post(`/teacher/leaves/${leaveId}/approve`, { remarks });
      
      // Refresh all leaves data
      await fetchAllLeaves();
      
      return { success: true };
    } catch (error) {
      console.error("Error approving leave:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Failed to approve leave" 
      };
    } finally {
      setLoading(false);
    }
  }, [fetchAllLeaves]);

  const rejectLeave = useCallback(async (leaveId, reason = "Rejected by teacher") => {
    try {
      setLoading(true);
      await api.post(`/teacher/leaves/${leaveId}/reject`, { reason });
      
      // Refresh all leaves data
      await fetchAllLeaves();
      
      return { success: true };
    } catch (error) {
      console.error("Error rejecting leave:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Failed to reject leave" 
      };
    } finally {
      setLoading(false);
    }
  }, [fetchAllLeaves]);

  return (
    <LeaveContext.Provider
      value={{
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        allLeaves,
        stats,
        loading,
        lastUpdated,
        fetchAllLeaves,
        approveLeave,
        rejectLeave
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};