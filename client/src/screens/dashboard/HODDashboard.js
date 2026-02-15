import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const HODDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const stats = [
    {
      title: "Dept Teachers",
      value: "12",
      icon: "account-tie",
      color: COLORS.hod,
    },
    {
      title: "Pending Approvals",
      value: "8",
      icon: "clipboard-clock",
      color: COLORS.warning,
    },
    { title: "Students", value: "145", icon: "school", color: COLORS.info },
    { title: "Leave %", value: "15%", icon: "percent", color: COLORS.success },
  ];

  const pendingApprovals = [
    {
      name: "Dr. Sarah Wilson",
      type: "Medical",
      days: 3,
      date: "Today",
      urgent: true,
    },
    {
      name: "Prof. Mike Johnson",
      type: "Personal",
      days: 2,
      date: "Today",
      urgent: false,
    },
    {
      name: "Ms. Emily Brown",
      type: "Academic",
      days: 5,
      date: "Yesterday",
      urgent: true,
    },
  ];

  const departmentStats = [
    { label: "Present", value: 85, color: COLORS.success },
    { label: "On Leave", value: 12, color: COLORS.warning },
    { label: "Absent", value: 3, color: COLORS.danger },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.hod} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.hod }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Department Head,</Text>
            <Text style={styles.userName}>{user?.name || "HOD Name"}</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
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
            {pendingApprovals.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.approvalCard}
                onPress={() =>
                  navigation.navigate("ApprovalDetail", { approval: item })
                }
              >
                <View style={styles.approvalLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.approvalName}>{item.name}</Text>
                    <Text style={styles.approvalType}>
                      {item.type} • {item.days} days
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
            ))}
          </View>
        </View>

        {/* Department Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Computer Science Dept</Text>
              <Text style={styles.overviewSubtitle}>Total Staff: 100</Text>
            </View>
            <View style={styles.progressContainer}>
              {departmentStats.map((stat, index) => (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View
                      style={[styles.dot, { backgroundColor: stat.color }]}
                    />
                    <Text style={styles.progressLabel}>{stat.label}</Text>
                    <Text style={styles.progressValue}>{stat.value}%</Text>
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("ApplyLeave")}
            >
              <Icon name="calendar-plus" size={24} color={COLORS.hod} />
              <Text style={styles.actionText}>Apply Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("DepartmentReport")}
            >
              <Icon name="file-document" size={24} color={COLORS.hod} />
              <Text style={styles.actionText}>Dept Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Team")}
            >
              <Icon name="account-group" size={24} color={COLORS.hod} />
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
  approvalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  approvalLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.hod + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.hod,
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
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slateDark,
    marginTop: 8,
  },
});

export default HODDashboard;
