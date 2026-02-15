import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import api from "../../services/api";

const { width } = Dimensions.get("window");

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalHODs: 0,
    pendingLeaves: 0,
    departments: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/admin/analytics");
      const data = response.data.data || {};
      setStats(data.stats || {});
      setRecentActivity(data.recentActivity || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const quickActions = [
    {
      title: "Manage Users",
      icon: "account-cog",
      screen: "Users",
      color: COLORS.admin,
    },
    {
      title: "Add User",
      icon: "account-plus",
      screen: "AddUser",
      color: COLORS.admin,
    },
    {
      title: "Bulk Upload",
      icon: "cloud-upload",
      screen: "BulkUpload",
      color: COLORS.success,
    },
    {
      title: "Departments",
      icon: "office-building",
      screen: "Departments",
      color: COLORS.info,
    },
    {
      title: "Leave Types",
      icon: "calendar",
      screen: "LeaveTypes",
      color: COLORS.warning,
    },
    // Disabled Buttons
    {
      title: "Reports",
      icon: "chart-bar",
      screen: null,
      color: COLORS.gray,
      disabled: true,
      disabledIcon: "lock-outline",
      disabledMessage: "Coming Soon",
    },
    {
      title: "Settings",
      icon: "cog",
      screen: null,
      color: COLORS.gray,
      disabled: true,
      disabledIcon: "lock-outline",
      disabledMessage: "Coming Soon",
    },
  ];

  const DisabledBadge = ({ message }) => (
    <View style={styles.disabledBadge}>
      <Icon name="lock" size={10} color="#fff" />
      <Text style={styles.disabledBadgeText}>{message}</Text>
    </View>
  );

  const ComingSoonOverlay = () => (
    <View style={styles.comingSoonOverlay}>
      <Icon name="clock-outline" size={20} color="#fff" />
      <Text style={styles.comingSoonText}>Coming Soon</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.admin} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.admin }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || "Administrator"}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
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
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.admin }]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.admin + "20" },
              ]}
            >
              <Icon name="account-group" size={24} color={COLORS.admin} />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statTitle}>Total Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.primary }]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.primary + "20" },
              ]}
            >
              <Icon name="school" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalStudents}</Text>
            <Text style={styles.statTitle}>Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.success }]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.success + "20" },
              ]}
            >
              <Icon name="account-tie" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{stats.totalTeachers}</Text>
            <Text style={styles.statTitle}>Teachers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.info }]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.info + "20" },
              ]}
            >
              <Icon name="shield-account" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.statValue}>{stats.totalHODs}</Text>
            <Text style={styles.statTitle}>HODs</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => {
              if (action.disabled) {
                return (
                  <View key={index} style={[styles.actionCard, styles.disabledCard]}>
                    <View style={styles.disabledIconContainer}>
                      <View
                        style={[
                          styles.actionIcon,
                          { backgroundColor: action.color + "15" },
                        ]}
                      >
                        <Icon name={action.icon} size={28} color={action.color} />
                      </View>
                      <View style={styles.lockIconContainer}>
                        <Icon name={action.disabledIcon} size={16} color="#fff" />
                      </View>
                    </View>
                    <Text style={[styles.actionTitle, styles.disabledText]}>
                      {action.title}
                    </Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonBadgeText}>SOON</Text>
                    </View>
                  </View>
                );
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={() => action.screen && navigation.navigate(action.screen)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: action.color + "15" },
                    ]}
                  >
                    <Icon name={action.icon} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Coming Soon Section Note */}
        <View style={styles.comingSoonNote}>
          <Icon name="information-outline" size={16} color={COLORS.info} />
          <Text style={styles.comingSoonNoteText}>
            Reports and Settings features are under development and will be available soon.
          </Text>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="history" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            ) : (
              recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIndicator,
                      { backgroundColor: COLORS.primary + "20" },
                    ]}
                  >
                    <Icon name="account" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityUser}>{activity.user}</Text>
                    <Text style={styles.activityAction}>{activity.action}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 80 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: 14, color: COLORS.white, opacity: 0.8 },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  content: { flex: 1, marginTop: -60 },
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
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: COLORS.slateDark },
  statTitle: { fontSize: 12, color: COLORS.slate, marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 16,
  },
  actionsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12,
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
    position: "relative",
  },
  disabledCard: {
    opacity: 0.8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  disabledIconContainer: {
    position: "relative",
    marginBottom: 12,
  },
  lockIconContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.slateDark },
  disabledText: {
    color: COLORS.gray,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  comingSoonNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.info + "15",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  comingSoonNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
    lineHeight: 18,
  },
  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "50",
  },
  activityIndicator: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityUser: { fontSize: 14, fontWeight: "600", color: COLORS.slateDark },
  activityAction: { fontSize: 13, color: COLORS.slate, marginTop: 2 },
  activityTime: { fontSize: 11, color: COLORS.slateLight, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#94A3B8", fontSize: 14, marginTop: 8 },
});

export default AdminDashboard;