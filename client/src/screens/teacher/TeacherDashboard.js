// screens/teacher/TeacherDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const StatCard = ({ icon, title, value, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const LeaveCard = ({ leave, onApprove, onReject }) => (
  <View style={styles.leaveCard}>
    <View style={styles.leaveHeader}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {leave.studentId?.personalInfo?.firstName}{" "}
          {leave.studentId?.personalInfo?.lastName}
        </Text>
        <Text style={styles.studentId}>{leave.studentId?.userId}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(leave.status) },
        ]}
      >
        <Text style={styles.statusText}>{leave.status.replace(/_/g, " ")}</Text>
      </View>
    </View>

    <View style={styles.leaveDetails}>
      <DetailRow
        icon="calendar-outline"
        label="From"
        value={formatDate(leave.fromDate)}
      />
      <DetailRow
        icon="calendar-outline"
        label="To"
        value={formatDate(leave.toDate)}
      />
      <DetailRow
        icon="document-text-outline"
        label="Type"
        value={leave.leaveType}
      />
      <DetailRow
        icon="chatbubble-outline"
        label="Reason"
        value={leave.reason}
      />
    </View>

    <View style={styles.leaveActions}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.approveBtn]}
        onPress={() => onApprove(leave._id)}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Approve</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.rejectBtn]}
        onPress={() => onReject(leave._id)}
      >
        <Ionicons name="close-circle" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate("TeacherLeaveRequests")}
      >
        <Ionicons name="time" size={28} color="#F59E0B" />
        <Text style={styles.actionText}>Leave Requests</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={16} color="#64748B" />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const getStatusColor = (status) => {
  const colors = {
    pending_teacher: "#F59E0B",
    pending_hod: "#3B82F6",
    approved_by_teacher: "#10B981",
    approved_by_hod: "#059669",
    rejected: "#EF4444",
  };
  return colors[status] || "#6B7280";
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TeacherDashboard = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingLeaves: 0,
    todayAbsents: 0,
    assignedClasses: [],
    subjects: [],
    isClassTeacher: false,
  });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, leavesRes, profileRes] = await Promise.all([
        api.get("/teacher/dashboard-stats"),
        api.get("/teacher/leaves/pending"),
        api.get("/teacher/profile"),
      ]);

      setStats(statsRes.data.data);
      setPendingLeaves(leavesRes.data.data);
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error("Dashboard load error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await api.patch(`/teacher/leaves/${leaveId}`, {
        status: "approved",
        remarks: "Approved by teacher",
      });
      Alert.alert("Success", "Leave approved");
      loadDashboardData();
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to approve",
      );
    }
  };

  const handleRejectLeave = async (leaveId) => {
    Alert.prompt(
      "Reject Leave",
      "Enter remarks (optional)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (remarks) => {
            try {
              await api.patch(`/teacher/leaves/${leaveId}`, {
                status: "rejected",
                remarks: remarks || "Rejected by teacher",
              });
              Alert.alert("Success", "Leave rejected");
              loadDashboardData();
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to reject",
              );
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const navigateToStudents = () => {
    // Navigate to My Class tab (which uses StudentList)
    navigation.navigate("My Class");
  };

  const navigateToProfile = () => {
    // Go up to App stack, then to TeacherProfile
    navigation.getParent()?.navigate("TeacherProfile");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Profile */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.teacherName}>
            {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName}
          </Text>
          <View style={styles.badges}>
            {stats.isClassTeacher && (
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.badgeText}>Class Teacher</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="book" size={12} color="#3B82F6" />
              <Text style={styles.badgeText}>
                {stats.subjects?.length || 0} Subjects
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={navigateToProfile}>
          <Ionicons name="person-circle" size={50} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          title="My Students"
          value={stats.totalStudents}
          color="#7C3AED"
          onPress={navigateToStudents}
        />
        <StatCard
          icon="time"
          title="Pending Leaves"
          value={stats.pendingLeaves}
          color="#F59E0B"
          onPress={() => navigation.navigate("TeacherLeaveHistory")}
        />

        <StatCard
          icon="close-circle"
          title="Absent Today"
          value={stats.todayAbsents}
          color="#EF4444"
          onPress={() => {}}
        />
        <StatCard
          icon="calendar"
          title="My Classes"
          value={stats.assignedClasses?.length || 0}
          color="#10B981"
          onPress={() => {}}
        />
      </View>

      {/* Assigned Classes */}
      {stats.assignedClasses?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stats.assignedClasses.map((cls, index) => (
              <View key={index} style={styles.classChip}>
                <Text style={styles.classChipText}>Class {cls}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Pending Leaves Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Leave Approvals</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("TeacherLeaveRequests")}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={() => navigation.navigate("TeacherLeaveHistory")}
          >
            <Text style={styles.seeAll}>See All History</Text>
          </TouchableOpacity> */}
        </View>

        {pendingLeaves.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyText}>No pending leave requests</Text>
          </View>
        ) : (
          pendingLeaves.map((leave) => (
            <LeaveCard
              key={leave._id}
              leave={leave}
              onApprove={handleApproveLeave}
              onReject={handleRejectLeave}
            />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToStudents}
          >
            <Ionicons name="people" size={28} color="#7C3AED" />
            <Text style={styles.actionText}>View Students</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("MarkAttendance")}
          >
            <Ionicons name="checkbox" size={28} color="#10B981" />
            <Text style={styles.actionText}>Mark Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("UploadMarks")}
          >
            <Ionicons name="document-text" size={28} color="#3B82F6" />
            <Text style={styles.actionText}>Upload Marks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  profileBtn: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    gap: 10,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    width: "47%",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statTitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 15,
  },
  seeAll: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  classChip: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  classChipText: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 14,
  },
  leaveCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  studentId: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  leaveDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 6,
    width: 60,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },
  leaveActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: "#10B981",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
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
    shadowRadius: 5,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default TeacherDashboard;
