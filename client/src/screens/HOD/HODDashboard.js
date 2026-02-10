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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";

const { width } = Dimensions.get("window");

const HodDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    pendingHodApprovals: 0,
    approvedByHod: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/hod/analytics");
      const data = res.data.data || {};

      setStats(data.stats || {});
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error("HOD dashboard error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: "Leave Approvals",
      icon: "file-check",
      screen: "HodLeaveApprovals",
      color: COLORS.warning,
    },
    {
      title: "Teachers",
      icon: "account-tie",
      screen: "DepartmentTeachers",
      color: COLORS.primary,
    },
    {
      title: "Students",
      icon: "school",
      screen: "DepartmentStudents",
      color: COLORS.info,
    },
    {
      title: "Department",
      icon: "office-building",
      screen: "DepartmentProfile",
      color: COLORS.success,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.hod || "#7C3AED"}
      />

      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: COLORS.hod || "#7C3AED" }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.personalInfo?.firstName || "HOD"}
            </Text>
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
          <StatCard
            color={COLORS.primary}
            icon="account-tie"
            value={stats.totalTeachers}
            title="Teachers"
          />

          <StatCard
            color={COLORS.info}
            icon="school"
            value={stats.totalStudents}
            title="Students"
          />

          <StatCard
            color={COLORS.warning}
            icon="clock-alert"
            value={stats.pendingHodApprovals}
            title="Pending Approvals"
          />

          <StatCard
            color={COLORS.success}
            icon="check-circle"
            value={stats.approvedByHod}
            title="Approved"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
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
            ))}
          </View>
        </View>

        {/* Recent Leave Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leave Activity</Text>

          <View style={styles.activityContainer}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="history" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No recent activity</Text>
              </View>
            ) : (
              recentActivity.map((item, i) => (
                <View key={i} style={styles.activityItem}>
                  <View style={styles.activityIndicator}>
                    <Icon
                      name="file-document"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityUser}>{item.user}</Text>
                    <Text style={styles.activityAction}>{item.action}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
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

/* Reusable stat card */
const StatCard = ({ icon, title, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 80 },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  content: { marginTop: -60 },

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
    elevation: 2,
    marginBottom: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: { fontSize: 22, fontWeight: "bold" },
  statTitle: { fontSize: 12, color: COLORS.slate },

  section: { marginTop: 24, paddingHorizontal: 20 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    marginBottom: 12,
  },

  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  actionTitle: { fontWeight: "600" },

  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  activityItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  activityIndicator: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#EEF2FF",
  },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { marginTop: 8, color: "#94A3B8" },
});

export default HodDashboard;
