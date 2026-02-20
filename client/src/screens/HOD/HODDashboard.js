// screens/HOD/HodDashboard.js
import React, { useEffect } from "react";
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
import { useHod } from "../../contexts/HodContext";
import { COLORS } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const HodDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { 
    stats, 
    recentActivity, 
    departmentName, 
    hodProfile,
    refreshAllData,
    loading 
  } = useHod();

  useEffect(() => {
    refreshAllData();
    
    // Add focus listener to refresh data when tab is focused
    const unsubscribe = navigation.addListener('focus', () => {
      refreshAllData();
    });

    return unsubscribe;
  }, [navigation, refreshAllData]);

  const onRefresh = async () => {
    await refreshAllData();
  };

  const quickActions = [
    {
      title: "Leave Approvals",
      icon: "file-check",
      screen: "HodLeaveApprovals",
      color: "#ff8801",
    },
    {
      title: "Teachers",
      icon: "account-tie",
      screen: "DepartmentTeachers",
      color: "#1c73dd",
    },
    {
      title: "Students",
      icon: "school",
      screen: "DepartmentStudents",
      color: "#cd10e2",
    },
    {
      title: "HOD Profile",
      icon: "account-circle",
      screen: "HodProfile",
      color: "#61d309",
    },
  ];

  // Get full name from context or user object
  const getFullName = () => {
    // Try to get from hodProfile first (most up-to-date)
    if (hodProfile?.personalInfo) {
      const { firstName, lastName } = hodProfile.personalInfo;
      if (firstName || lastName) {
        return `${firstName || ""} ${lastName || ""}`.trim();
      }
    }
    
    // Fallback to user object from auth context
    if (user?.personalInfo) {
      const { firstName, lastName } = user.personalInfo;
      if (firstName || lastName) {
        return `${firstName || ""} ${lastName || ""}`.trim();
      }
    }
    
    // Final fallback
    return "HOD";
  };

  // Get first name for greeting
  const getFirstName = () => {
    // Try to get from hodProfile first
    if (hodProfile?.personalInfo?.firstName) {
      return hodProfile.personalInfo.firstName;
    }
    
    // Fallback to user object
    if (user?.personalInfo?.firstName) {
      return user.personalInfo.firstName;
    }
    
    return "HOD";
  };

  const fullName = getFullName();
  const firstName = getFirstName();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#d13030"
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#d13030" }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {fullName}
            </Text>
            
            {/* Department Badge - Now updates in real-time */}
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
          <RefreshControl 
            refreshing={loading} 
            onRefresh={onRefresh}
            colors={["#d13030"]}
            tintColor="#d13030"
          />
        }
      >
        {/* Stats - Now with 5 cards in a grid */}
        <View style={styles.statsContainer}>
          <StatCard
            color="#1c73dd"
            icon="account-tie"
            value={stats.totalTeachers}
            title="Teachers"
          />

          <StatCard
            color="#cd10e2"
            icon="school"
            value={stats.totalStudents}
            title="Students"
          />

          <StatCard
            color="#ff8801"
            icon="clock-alert"
            value={stats.pendingHodApprovals}
            title="Pending Approvals"
          />

          <StatCard
            color="#61d309"
            icon="check-circle"
            value={stats.approvedByHod}
            title="Approved"
          />

          {/* New Rejected Stat Card */}
          <StatCard
            color="#EF4444" // Red color for rejected
            icon="close-circle"
            value={stats.rejectedByHod || 0}
            title="Rejected"
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
  departmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 0,
  },
  departmentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
    padding: 3,
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