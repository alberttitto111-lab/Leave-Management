// screens/HOD/HodDashboard.js
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
  const [departmentName, setDepartmentName] = useState("");

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

  const fetchDepartmentInfo = async () => {
    try {
      // Fetch HOD's department info
      const res = await api.get("/hod/department-info");
      if (res.data.success) {
        setDepartmentName(res.data.data.departmentName || "");
      }
    } catch (err) {
      console.error("Failed to fetch department info:", err);
      
      // Fallback: Try to get department from user object
      if (user?.departmentId?.name) {
        setDepartmentName(user.departmentId.name);
      } else if (user?.departmentId) {
        // If we have department ID but not name, fetch it separately
        try {
          const deptRes = await api.get(`/admin/departments/${user.departmentId}`);
          setDepartmentName(deptRes.data.name);
        } catch (deptErr) {
          console.error("Failed to fetch department details:", deptErr);
        }
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDepartmentInfo();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchDepartmentInfo()]);
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: "Leave Requests",
      icon: "file-check",
      screen: "HodLeaveApprovals",
      color: "#f5880b",
    },
    {
      title: "Teachers",
      icon: "account-tie",
      screen: "DepartmentTeachers",
      color: "#1f79f7",
    },
    {
      title: "Students",
      icon: "school",
      screen: "DepartmentStudents",
      color: "#cd20b6",
    },
    {
      title: "My Profile", // Changed from "Department" to "HOD Profile"
      icon: "account-circle", // Changed icon to profile icon
      screen: "HodProfile", // Updated screen name
      color: "#0cb706", // Using header color for consistency
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#d13030" // Matching header color
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#d13030" }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.personalInfo?.firstName || "HOD"}
            </Text>
            
            {/* Department Badge */}
            {departmentName ? (
              <View style={styles.departmentBadge}>
                <Icon name="star" size={14} color="#ffdd00" />
                <Text style={styles.departmentBadgeText}>{departmentName}</Text>
              </View>
            ) : null}
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
            color= "#1f7ff4"
            icon="account-tie"
            value={stats.totalTeachers}
            title="Teachers"
          />

          <StatCard
            color= "#c61ff4"
            icon="school"
            value={stats.totalStudents}
            title="Students"
          />

          <StatCard
            color= "#f4911f"
            icon="clock-alert"
            value={stats.pendingHodApprovals}
            title="Pending Approvals"
          />

          <StatCard
            color= "#17cf1d"
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
  container: { 
    flex: 1, 
    backgroundColor: "#f3e1e1", 
  },
  header: { 
    paddingHorizontal: 20, 
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
  },
  greeting: { 
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  // Department Badge styles
  departmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 3,
  },
  departmentBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    padding: 3
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: { 
    // marginTop: 10, 
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10, 
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: "bold", 
  },
  statTitle: { 
    fontSize: 12, 
    color: COLORS.slate, 
  },
  section: { 
    marginTop: 24, 
    paddingHorizontal: 20, 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  actionsGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12, 
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: { 
    fontWeight: "600", 
  },
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
  emptyState: { 
    alignItems: "center", 
    paddingVertical: 40, 
  },
  emptyText: { 
    marginTop: 8, 
    color: "#94A3B8", 
  },
});

export default HodDashboard;