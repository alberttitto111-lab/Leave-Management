import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { API_BASE_URL } from "../../utils/constants";

const { width } = Dimensions.get("window");

const HODDashboard = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    deptTeachers: 0,
    pendingApprovals: 0,
    students: 0,
    leavePercentage: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [departmentOverview, setDepartmentOverview] = useState(null);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, approvalsRes, overviewRes] = await Promise.all([
        api.get("/hod/dashboard/stats"),
        api.get("/hod/dashboard/pending-approvals"),
        api.get("/hod/dashboard/department-overview"),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (approvalsRes.data.success) {
        setPendingApprovals(approvalsRes.data.data);
      }
      if (overviewRes.data.success) {
        setDepartmentOverview(overviewRes.data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleApprove = async (leaveId) => {
    try {
      const response = await api.post(
        `/hod/dashboard/approve-leave/${leaveId}`,
        {
          comments: "Approved by HOD",
        },
      );
      if (response.data.success) {
        Alert.alert("Success", "Leave approved successfully");
        fetchDashboardData();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to approve leave",
      );
    }
  };

  const handleReject = async (leaveId) => {
    Alert.prompt(
      "Reject Leave",
      "Enter rejection reason:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            try {
              const response = await api.post(
                `/hod/dashboard/reject-leave/${leaveId}`,
                {
                  reason: reason || "Rejected by HOD",
                },
              );
              if (response.data.success) {
                Alert.alert("Success", "Leave rejected");
                fetchDashboardData();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to reject leave");
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const statsData = [
    {
      title: "Dept Teachers",
      value: stats.deptTeachers.toString(),
      icon: "account-tie",
      color: COLORS.hod,
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: "clipboard-clock",
      color: COLORS.warning,
    },
    {
      title: "Students",
      value: stats.students.toString(),
      icon: "school",
      color: COLORS.info,
    },
    {
      title: "Leave %",
      value: `${stats.leavePercentage}%`,
      icon: "percent",
      color: COLORS.success,
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.hod} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.hod} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.hod }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Department Head,</Text>
            <Text style={styles.userName}>
              {user?.personalInfo?.firstName
                ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}`
                : user?.userId || "HOD Name"}
            </Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Text style={styles.roleText}>HOD</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          {statsData.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { borderTopColor: stat.color }]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: stat.color + "20" },
                ]}
              >
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Pending Approvals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Approvals")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.approvalList}>
            {pendingApprovals.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={48} color={COLORS.success} />
                <Text style={styles.emptyText}>No pending approvals</Text>
              </View>
            ) : (
              pendingApprovals.map((item, index) => (
                <View key={item._id || index} style={styles.approvalCard}>
                  <TouchableOpacity
                    style={styles.approvalContent}
                    onPress={() =>
                      navigation.navigate("ApprovalDetail", { approval: item })
                    }
                  >
                    <View style={styles.approvalLeft}>
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor:
                              item.typeCode === "MEDICAL"
                                ? "#FEE2E2"
                                : COLORS.hod + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            {
                              color:
                                item.typeCode === "MEDICAL"
                                  ? "#DC2626"
                                  : COLORS.hod,
                            },
                          ]}
                        >
                          {item.name.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.approvalName}>{item.name}</Text>
                        <Text style={styles.approvalType}>
                          {item.type} • {item.days} days
                        </Text>
                        <Text style={styles.approvalDateSmall}>
                          {new Date(item.startDate).toLocaleDateString()} -{" "}
                          {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.approvalRight}>
                      {item.urgent && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      )}
                      <Text style={styles.approvalDate}>{item.date}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Quick Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(item._id)}
                    >
                      <Icon name="close" size={16} color={COLORS.danger} />
                      <Text
                        style={[styles.actionBtnText, { color: COLORS.danger }]}
                      >
                        Reject
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(item._id)}
                    >
                      <Icon name="check" size={16} color={COLORS.success} />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: COLORS.success },
                        ]}
                      >
                        Approve
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Department Overview */}
        {departmentOverview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.overviewTitle}>
                  {departmentOverview.departmentName}
                </Text>
                <Text style={styles.overviewSubtitle}>
                  Total Staff: {departmentOverview.totalStaff}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                {departmentOverview.stats.map((stat, index) => (
                  <View key={index} style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                      <View
                        style={[styles.dot, { backgroundColor: stat.color }]}
                      />
                      <Text style={styles.progressLabel}>{stat.label}</Text>
                      <Text style={styles.progressValue}>
                        {stat.value}% ({stat.count})
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${stat.value}%`,
                            backgroundColor: stat.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("ApplyLeave")}
            >
              <View
                style={[
                  styles.actionIconBg,
                  { backgroundColor: COLORS.hod + "15" },
                ]}
              >
                <Icon name="calendar-plus" size={24} color={COLORS.hod} />
              </View>
              <Text style={styles.actionText}>Apply Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("DepartmentReport")}
            >
              <View
                style={[
                  styles.actionIconBg,
                  { backgroundColor: COLORS.info + "15" },
                ]}
              >
                <Icon name="file-document" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.actionText}>Dept Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Team")}
            >
              <View
                style={[
                  styles.actionIconBg,
                  { backgroundColor: COLORS.success + "15" },
                ]}
              >
                <Icon name="account-group" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>My Team</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  roleText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: {
    flex: 1,
    marginTop: -60,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.slateDark,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.hod,
    fontWeight: "600",
  },
  approvalList: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
  },
  approvalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  approvalContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  approvalLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  approvalName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  approvalType: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  approvalDateSmall: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginTop: 2,
  },
  approvalRight: {
    alignItems: "flex-end",
  },
  urgentBadge: {
    backgroundColor: COLORS.danger + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  urgentText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: "700",
  },
  approvalDate: {
    fontSize: 12,
    color: COLORS.slateLight,
  },
  actionButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  rejectBtn: {
    borderRightWidth: 1,
    borderRightColor: COLORS.grayLight,
    backgroundColor: COLORS.danger + "05",
  },
  approveBtn: {
    backgroundColor: COLORS.success + "05",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewHeader: {
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slateDark,
  },
  overviewSubtitle: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  progressLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.grayLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
});

export default HODDashboard;
