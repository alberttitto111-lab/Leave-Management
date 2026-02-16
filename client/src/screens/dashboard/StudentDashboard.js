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

const StudentDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  // Calculate leave percentage and status color
  const leavePercentage = 18; // This would come from API
  const attendanceColor =
    leavePercentage < 15
      ? COLORS.success
      : leavePercentage < 25
        ? COLORS.warning
        : COLORS.danger;

  const leaveStats = [
    { type: "Medical", used: 3, total: 10, color: COLORS.danger },
    { type: "Personal", used: 2, total: 5, color: COLORS.warning },
    { type: "Academic", used: 1, total: "Unlimited", color: COLORS.info },
  ];

  const upcomingHolidays = [
    { name: "Republic Day", date: "Jan 26", daysLeft: 5 },
    { name: "Holi", date: "Mar 25", daysLeft: 45 },
  ];

  const recentLeaves = [
    { type: "Medical", date: "Jan 10, 2024", status: "approved", days: 2 },
    { type: "Personal", date: "Dec 15, 2023", status: "approved", days: 1 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.student} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.student }]}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0) : "S"}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {user?.name || "Student Name"}
              </Text>
              <Text style={styles.userInfo}>Class 10-A • Roll: 24</Text>
              <Text style={styles.userInfo}>Science Department</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Attendance Warning Card */}
        <View
          style={[
            styles.warningCard,
            {
              backgroundColor: attendanceColor + "15",
              borderColor: attendanceColor + "30",
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.warningHeader}>
            <Icon name="chart-pie" size={24} color={attendanceColor} />
            <Text style={[styles.warningTitle, { color: attendanceColor }]}>
              Attendance Overview
            </Text>
          </View>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceItem}>
              <Text style={styles.attendancePercent}>
                {100 - leavePercentage}%
              </Text>
              <Text style={styles.attendanceLabel}>Attendance</Text>
            </View>
            <View style={styles.attendanceDivider} />
            <View style={styles.attendanceItem}>
              <Text
                style={[styles.attendancePercent, { color: attendanceColor }]}
              >
                {leavePercentage}%
              </Text>
              <Text style={styles.attendanceLabel}>Leave Taken</Text>
            </View>
          </View>
          {leavePercentage > 25 && (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: COLORS.danger + "20" },
              ]}
            >
              <Icon name="alert" size={16} color={COLORS.danger} />
              <Text style={styles.alertText}>
                Warning: Your attendance is below 75%. You cannot apply for new
                leaves.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.student }]}
            onPress={() => navigation.navigate("ApplyLeave")}
          >
            <Icon name="calendar-plus" size={28} color={COLORS.white} />
            <Text style={styles.actionText}>Apply Leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.info }]}
            onPress={() => navigation.navigate("LeaveHistory")}
          >
            <Icon name="history" size={28} color={COLORS.white} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.success }]}
            onPress={() => navigation.navigate("Attendance")}
          >
            <Icon name="chart-line" size={28} color={COLORS.white} />
            <Text style={styles.actionText}>Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Leave Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balance</Text>
          <View style={styles.balanceContainer}>
            {leaveStats.map((stat, index) => (
              <View key={index} style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                  <View
                    style={[styles.balanceDot, { backgroundColor: stat.color }]}
                  />
                  <Text style={styles.balanceType}>{stat.type}</Text>
                </View>
                <Text style={styles.balanceNumbers}>
                  <Text style={styles.used}>{stat.used}</Text>
                  <Text style={styles.total}> / {stat.total}</Text>
                </Text>
                <Text style={styles.balanceLabel}>days used</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${typeof stat.total === "number" ? (stat.used / stat.total) * 100 : 10}%`,
                        backgroundColor: stat.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Leaves */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leaves</Text>
          {recentLeaves.map((leave, index) => (
            <View key={index} style={styles.leaveItem}>
              <View
                style={[
                  styles.leaveIcon,
                  { backgroundColor: COLORS.success + "20" },
                ]}
              >
                <Icon name="check" size={20} color={COLORS.success} />
              </View>
              <View style={styles.leaveInfo}>
                <Text style={styles.leaveType}>{leave.type} Leave</Text>
                <Text style={styles.leaveDate}>{leave.date}</Text>
              </View>
              <View style={styles.leaveMeta}>
                <Text style={styles.leaveDays}>{leave.days} days</Text>
                <Text style={[styles.leaveStatus, { color: COLORS.success }]}>
                  {leave.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Upcoming Holidays */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
          {upcomingHolidays.map((holiday, index) => (
            <View key={index} style={styles.holidayCard}>
              <View style={styles.holidayDate}>
                <Text style={styles.holidayMonth}>
                  {holiday.date.split(" ")[0]}
                </Text>
                <Text style={styles.holidayDay}>
                  {holiday.date.split(" ")[1]}
                </Text>
              </View>
              <View style={styles.holidayInfo}>
                <Text style={styles.holidayName}>{holiday.name}</Text>
                <Text style={styles.holidayCountdown}>
                  in {holiday.daysLeft} days
                </Text>
              </View>
              <Icon name="calendar-star" size={24} color={COLORS.warning} />
            </View>
          ))}
        </View>

        {/* Class Teacher Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Teacher</Text>
          <View style={styles.teacherCard}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.teacherAvatarText}>MR</Text>
            </View>
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>Mr. Rajesh Kumar</Text>
              <Text style={styles.teacherSubject}>Mathematics</Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Icon name="message-text" size={20} color={COLORS.student} />
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
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  userInfo: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
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
  warningCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  attendanceItem: {
    alignItems: "center",
    flex: 1,
  },
  attendancePercent: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.success,
  },
  attendanceLabel: {
    fontSize: 12,
    color: COLORS.slate,
    marginTop: 4,
  },
  attendanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.grayLight,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  alertText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.danger,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: "row",
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  balanceType: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate,
  },
  balanceNumbers: {
    marginBottom: 4,
  },
  used: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.slateDark,
  },
  total: {
    fontSize: 14,
    color: COLORS.slate,
  },
  balanceLabel: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.grayLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  leaveItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leaveIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaveInfo: {
    flex: 1,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  leaveDate: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  leaveMeta: {
    alignItems: "flex-end",
  },
  leaveDays: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  leaveStatus: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  holidayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  holidayDate: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.warning + "15",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  holidayMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
    textTransform: "uppercase",
  },
  holidayDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.warning,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  holidayCountdown: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  teacherCard: {
    flexDirection: "row",
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
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.student + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  teacherAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.student,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  teacherSubject: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
  contactButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.student + "10",
  },
});

export default StudentDashboard;
