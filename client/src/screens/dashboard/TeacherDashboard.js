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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const TeacherDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const stats = [
    {
      title: "Leave Balance",
      value: "12",
      subtext: "days remaining",
      icon: "calendar-check",
      color: COLORS.teacher,
    },
    {
      title: "Pending",
      value: "2",
      subtext: "requests",
      icon: "clock-outline",
      color: COLORS.warning,
    },
    {
      title: "Used",
      value: "8",
      subtext: "this year",
      icon: "calendar-month",
      color: COLORS.info,
    },
    {
      title: "Attendance",
      value: "92%",
      subtext: "this month",
      icon: "chart-line",
      color: COLORS.success,
    },
  ];

  const recentLeaves = [
    { type: "Medical", dates: "Jan 15-17", status: "approved", days: 3 },
    { type: "Personal", dates: "Dec 20", status: "approved", days: 1 },
    { type: "Academic", dates: "Dec 10-12", status: "rejected", days: 3 },
  ];

  const classStudents = [
    { name: "Alice Johnson", roll: "CS101", status: "present" },
    { name: "Bob Smith", roll: "CS102", status: "leave" },
    { name: "Charlie Brown", roll: "CS103", status: "absent" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teacher} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.teacher }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>{user?.name || "Teacher Name"}</Text>
            <Text style={styles.department}>Computer Science Dept</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leave Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statCard]}
              activeOpacity={0.8}
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
              <Text style={styles.statSubtext}>{stat.subtext}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Apply */}
        <TouchableOpacity
          style={[styles.applyCard, { backgroundColor: COLORS.teacher }]}
          onPress={() => navigation.navigate("ApplyLeave")}
        >
          <View style={styles.applyContent}>
            <Icon name="plus-circle" size={32} color={COLORS.white} />
            <View style={styles.applyTextContainer}>
              <Text style={styles.applyTitle}>Apply for Leave</Text>
              <Text style={styles.applySubtitle}>
                Request time off in seconds
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Recent Leaves */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Recent Leaves</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("LeaveHistory")}
            >
              <Text style={[styles.seeAll, { color: COLORS.teacher }]}>
                History
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.leaveList}>
            {recentLeaves.map((leave, index) => (
              <View key={index} style={styles.leaveCard}>
                <View style={styles.leaveLeft}>
                  <View
                    style={[
                      styles.leaveIcon,
                      {
                        backgroundColor:
                          leave.status === "approved"
                            ? COLORS.success + "20"
                            : leave.status === "rejected"
                              ? COLORS.danger + "20"
                              : COLORS.warning + "20",
                      },
                    ]}
                  >
                    <Icon
                      name={
                        leave.status === "approved"
                          ? "check"
                          : leave.status === "rejected"
                            ? "close"
                            : "clock"
                      }
                      size={20}
                      color={
                        leave.status === "approved"
                          ? COLORS.success
                          : leave.status === "rejected"
                            ? COLORS.danger
                            : COLORS.warning
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.leaveType}>{leave.type}</Text>
                    <Text style={styles.leaveDates}>{leave.dates}</Text>
                  </View>
                </View>
                <View style={styles.leaveRight}>
                  <Text
                    style={[
                      styles.leaveStatus,
                      {
                        color:
                          leave.status === "approved"
                            ? COLORS.success
                            : leave.status === "rejected"
                              ? COLORS.danger
                              : COLORS.warning,
                      },
                    ]}
                  >
                    {leave.status.toUpperCase()}
                  </Text>
                  <Text style={styles.leaveDays}>{leave.days} days</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Class Overview (Only for Class Teachers) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Class 10-A Overview</Text>
            <Text style={styles.classSubtitle}>Class Teacher</Text>
          </View>

          <View style={styles.classCard}>
            <View style={styles.classHeader}>
              <Text style={styles.classInfo}>Total Students: 45</Text>
              <TouchableOpacity style={styles.markButton}>
                <Text style={styles.markButtonText}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.attendanceSummary}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  40
                </Text>
                <Text style={styles.summaryLabel}>Present</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                  3
                </Text>
                <Text style={styles.summaryLabel}>Leave</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                  2
                </Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
            </View>

            <Text style={styles.recentTitle}>Recent Leave Requests</Text>
            {classStudents.map((student, index) => (
              <View key={index} style={styles.studentItem}>
                <View style={styles.studentLeft}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {student.name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>{student.roll}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        student.status === "present"
                          ? COLORS.success + "20"
                          : student.status === "leave"
                            ? COLORS.warning + "20"
                            : COLORS.danger + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          student.status === "present"
                            ? COLORS.success
                            : student.status === "leave"
                              ? COLORS.warning
                              : COLORS.danger,
                      },
                    ]}
                  >
                    {student.status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
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
  department: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
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
    alignItems: "center",
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
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.slateDark,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.slate,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginTop: 2,
  },
  applyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  applyContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  applyTextContainer: {
    marginLeft: 16,
  },
  applyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  applySubtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
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
    fontWeight: "600",
  },
  classSubtitle: {
    fontSize: 12,
    color: COLORS.slateLight,
    backgroundColor: COLORS.grayLight + "50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaveList: {
    gap: 10,
  },
  leaveCard: {
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
  leaveLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaveIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  leaveDates: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  leaveRight: {
    alignItems: "flex-end",
  },
  leaveStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  leaveDays: {
    fontSize: 12,
    color: COLORS.slateLight,
    marginTop: 2,
  },
  classCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  classInfo: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  markButton: {
    backgroundColor: COLORS.teacher + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.teacher,
  },
  attendanceSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.grayLight,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate,
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "50",
  },
  studentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.teacher + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.teacher,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  studentRoll: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default TeacherDashboard;
