// screens/teacher/TeacherDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useLeave } from "../../contexts/LeaveContext"; // Add this import

// StatCard component (unchanged)
const StatCard = ({ icon, title, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

// LeaveCard component (unchanged)
const LeaveCard = ({ leave, onPress }) => {
  const getStatusColor = (status) => {
    const colors = {
      "pending": "#F59E0B",
      "approved_by_teacher": "#3B82F6",
    };
    return colors[status] || "#6B7280";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <TouchableOpacity style={styles.horizontalLeaveCard} onPress={() => onPress(leave)}>
      <View style={styles.horizontalCardContent}>
        <View style={styles.horizontalAvatarContainer}>
          <View style={styles.horizontalAvatar}>
            <Text style={styles.horizontalAvatarText}>
              {leave.applicantId?.personalInfo?.firstName?.charAt(0) || ""}
              {leave.applicantId?.personalInfo?.lastName?.charAt(0) || ""}
            </Text>
          </View>
        </View>
        
        <View style={styles.horizontalCardDetails}>
          <View style={styles.horizontalRow}>
            <Text style={styles.horizontalStudentName} numberOfLines={1}>
              {leave.applicantId?.personalInfo?.firstName || ""} {leave.applicantId?.personalInfo?.lastName || ""}
            </Text>
            <View
              style={[
                styles.horizontalStatusBadge,
                { backgroundColor: getStatusColor(leave.status) },
              ]}
            >
              <Text style={styles.horizontalStatusText}>
                {leave.status === "pending" ? "Pending" : "Approved"}
              </Text>
            </View>
          </View>
          
          <Text style={styles.horizontalLeaveType} numberOfLines={1}>
            {leave.leaveType?.name || "Leave"} • {leave.dateRange?.days || 0} day(s)
          </Text>
          
          <Text style={styles.horizontalLeaveDates} numberOfLines={1}>
            {formatDate(leave.dateRange?.from)} - {formatDate(leave.dateRange?.to)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TeacherDashboard = ({ navigation }) => {
  const { logout } = useAuth();
  const { 
    pendingLeaves, 
    approvedLeaves, 
    stats, 
    loading: leavesLoading, 
    fetchAllLeaves,
    approveLeave,
    rejectLeave
  } = useLeave();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    assignedClasses: [],
    subjects: [],
    isClassTeacher: false,
  });
  const [profile, setProfile] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsRes = await api.get("/teacher/dashboard-stats");
      
      // Fetch profile
      const profileRes = await api.get("/teacher/profile");
      
      // Fetch leaves data through context
      await fetchAllLeaves();
      
      setDashboardStats({
        totalStudents: statsRes.data.data?.totalStudents || 0,
        assignedClasses: statsRes.data.data?.assignedClasses || [],
        subjects: statsRes.data.data?.subjects || [],
        isClassTeacher: statsRes.data.data?.isClassTeacher || false,
      });
      
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error("Dashboard load error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAllLeaves]);

  useEffect(() => {
    loadDashboardData();
    
    // Add focus listener to refresh data when tab is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllLeaves();
    });

    return unsubscribe;
  }, [navigation, fetchAllLeaves, loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleApproveLeave = async (leaveId) => {
    const result = await approveLeave(leaveId);
    if (result.success) {
      Alert.alert("Success", "Leave approved and forwarded to HOD");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    Alert.prompt(
      "Reject Leave",
      "Enter reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            const result = await rejectLeave(leaveId, reason || "Rejected by teacher");
            if (result.success) {
              Alert.alert("Success", "Leave rejected");
            } else {
              Alert.alert("Error", result.message);
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const navigateToStudents = () => {
    navigation.navigate("My Class");
  };

  const navigateToProfile = () => {
    navigation.getParent()?.navigate("TeacherProfile");
  };

  const navigateToLeaveRequests = () => {
    navigation.navigate("TeacherLeaveRequests");
  };

  const handleLeavePress = (leave) => {
    if (leave.status === "pending") {
      Alert.alert(
        "Leave Request",
        `What would you like to do with ${leave.applicantId?.personalInfo?.firstName}'s leave request?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Approve", 
            onPress: () => handleApproveLeave(leave._id),
            style: "default"
          },
          { 
            text: "Reject", 
            onPress: () => handleRejectLeave(leave._id),
            style: "destructive"
          },
        ]
      );
    } else {
      Alert.alert(
        "Leave Request",
        `This leave request has been approved by you and is waiting for HOD approval.`,
        [{ text: "OK" }]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // Combine pending and approved leaves for the horizontal scroll
  const allPendingRequests = [...pendingLeaves, ...approvedLeaves];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.teacherName}>
              {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName}
            </Text>
            <View style={styles.badgeContainer}>
              {dashboardStats.isClassTeacher && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.badgeText}>Class Teacher</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="book" size={12} color="#fff" />
                <Text style={styles.badgeText}>
                  {dashboardStats.subjects?.length || 0} Subjects
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          title="My Students"
          value={dashboardStats.totalStudents}
          color="#0D9488"
        />
        <StatCard
          icon="time"
          title="Pending"
          value={stats.pending}
          color="#F59E0B"
        />
        <StatCard
          icon="checkmark-circle"
          title="Approved"
          value={stats.approved}
          color="#3B82F6"
        />
        <StatCard
          icon="close-circle"
          title="Rejected"
          value={stats.rejected}
          color="#EF4444"
        />
      </View>

      {/* Assigned Classes */}
      {dashboardStats.assignedClasses?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dashboardStats.assignedClasses.map((cls, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.classChip}
                onPress={() => {}}
              >
                <Text style={styles.classChipText}>Class {cls}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToStudents}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0D9488' }]}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>My Students</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToLeaveRequests}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="time" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Leave Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToProfile}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Leaves Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Leave Approvals</Text>
          <TouchableOpacity onPress={navigateToLeaveRequests}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {allPendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyText}>No pending leave requests</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScrollView}
          >
            {allPendingRequests.map((leave) => (
              <LeaveCard
                key={leave._id}
                leave={leave}
                onPress={handleLeavePress}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
};

// Styles remain the same as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    fontWeight: "500",
  },
  teacherName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
    marginTop: 10,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "47%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  seeAll: {
    fontSize: 14,
    color: "#0D9488",
    fontWeight: "600",
  },
  classChip: {
    backgroundColor: "#E6FFFA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#0D9488",
  },
  classChipText: {
    color: "#0D9488",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  horizontalScrollView: {
    marginBottom: 8,
  },
  horizontalLeaveCard: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalCardContent: {
    flexDirection: "row",
  },
  horizontalAvatarContainer: {
    marginRight: 12,
  },
  horizontalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6FFFA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0D9488",
  },
  horizontalAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D9488",
  },
  horizontalCardDetails: {
    flex: 1,
    justifyContent: "center",
  },
  horizontalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  horizontalStudentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  horizontalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  horizontalStatusText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  horizontalLeaveType: {
    fontSize: 12,
    color: "#0D9488",
    fontWeight: "500",
    marginBottom: 2,
  },
  horizontalLeaveDates: {
    fontSize: 10,
    color: "#64748B",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default TeacherDashboard;