// screens/student/LeaveDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const LeaveDetailsScreen = ({ route, navigation }) => {
  const { leaveId } = route.params;
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchLeaveDetails();
  }, [leaveId]);

  const fetchLeaveDetails = async () => {
    try {
      setLoading(true);
      // Fetch leave details
      const response = await api.get(`/student/leave/${leaveId}`);
      const leaveData = response.data.data;
      setLeave(leaveData);
      
      // Fetch student profile for additional info
      const studentRes = await api.get("/student/profile");
      setStudent(studentRes.data.data);
    } catch (error) {
      console.error("Error fetching leave details:", error);
      Alert.alert("Error", "Failed to load leave details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (leave?.finalStatus === "approved") return COLORS.success;
    if (leave?.finalStatus === "rejected") return COLORS.danger;
    return COLORS.warning;
  };

  const getStatusIcon = () => {
    if (leave?.finalStatus === "approved") return "checkmark-circle";
    if (leave?.finalStatus === "rejected") return "close-circle";
    return "time-outline";
  };

  const getStatusText = () => {
    if (leave?.finalStatus === "approved") return "APPROVED";
    if (leave?.finalStatus === "rejected") return "REJECTED";
    if (leave?.status === "approved_by_teacher") return "PENDING HOD";
    return "PENDING";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getApprovalChain = () => {
    if (!leave?.approvals) return [];
    return leave.approvals.map(approval => ({
      level: approval.level === 1 ? "Teacher" : "HOD",
      status: approval.status,
      date: approval.approvedAt || approval.rejectedAt,
      remarks: approval.remarks
    }));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading leave details...</Text>
      </View>
    );
  }

  if (!leave) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Leave request not found</Text>
      </View>
    );
  }

  const studentInfo = student?.personalInfo || {};
  const academicInfo = student?.academicInfo || {};
  const approvalChain = getApprovalChain();
  const isFinalized = leave.finalStatus === "approved" || leave.finalStatus === "rejected";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Stamp */}
        {isFinalized && (
          <View style={[
            styles.stampContainer,
            leave.finalStatus === "approved" ? styles.approvedStamp : styles.rejectedStamp
          ]}>
            <Ionicons 
              name={leave.finalStatus === "approved" ? "checkmark-done" : "close"} 
              size={40} 
              color={leave.finalStatus === "approved" ? COLORS.success : COLORS.danger} 
            />
            <Text style={[
              styles.stampText,
              leave.finalStatus === "approved" ? styles.approvedStampText : styles.rejectedStampText
            ]}>
              {leave.finalStatus === "approved" ? "APPROVED" : "REJECTED"}
            </Text>
          </View>
        )}

        {/* Student Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {studentInfo.firstName || ""} {studentInfo.lastName || ""}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class:</Text>
            <Text style={styles.infoValue}>
              {academicInfo.class || "N/A"} - {academicInfo.section || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll Number:</Text>
            <Text style={styles.infoValue}>{academicInfo.rollNumber || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{student?.userId || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{studentInfo.email || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{studentInfo.phone || "N/A"}</Text>
          </View>
        </View>

        {/* Leave Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leave Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Request ID:</Text>
            <Text style={styles.infoValue}>#{leave.requestId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Leave Type:</Text>
            <View style={styles.leaveTypeBadge}>
              <View style={[styles.colorDot, { backgroundColor: leave.leaveType?.color || COLORS.primary }]} />
              <Text style={styles.leaveTypeText}>{leave.leaveType?.name || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{leave.dateRange?.days || 0} day(s)</Text>
          </View>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatDate(leave.dateRange?.from)}</Text>
            </View>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.slateLight} />
            </View>

            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(leave.dateRange?.to)}</Text>
            </View>
          </View>

          {leave.halfDay && (
            <View style={styles.halfDayBadge}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.halfDayText}>Half Day Leave</Text>
            </View>
          )}

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{leave.reason}</Text>
          </View>
        </View>

        {/* Approval Chain Card */}
        {approvalChain.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Approval Status</Text>
            
            {approvalChain.map((item, index) => (
              <View key={index} style={styles.approvalItem}>
                <View style={styles.approvalHeader}>
                  <View style={styles.approverInfo}>
                    <View style={[
                      styles.approvalDot,
                      { backgroundColor: item.status === "approved" ? COLORS.success : COLORS.danger }
                    ]} />
                    <Text style={styles.approverName}>{item.level}</Text>
                  </View>
                  <View style={[
                    styles.approvalStatusBadge,
                    { backgroundColor: item.status === "approved" ? COLORS.success + "20" : COLORS.danger + "20" }
                  ]}>
                    <Ionicons 
                      name={item.status === "approved" ? "checkmark" : "close"} 
                      size={12} 
                      color={item.status === "approved" ? COLORS.success : COLORS.danger} 
                    />
                    <Text style={[
                      styles.approvalStatusText,
                      { color: item.status === "approved" ? COLORS.success : COLORS.danger }
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {item.date && (
                  <Text style={styles.approvalDate}>
                    {new Date(item.date).toLocaleString()}
                  </Text>
                )}
                
                {item.remarks && (
                  <Text style={styles.approvalRemarks}>Note: {item.remarks}</Text>
                )}
              </View>
            ))}

            <View style={styles.finalStatusContainer}>
              <Text style={styles.finalStatusLabel}>Final Status:</Text>
              <View style={[
                styles.finalStatusBadge,
                { backgroundColor: getStatusColor() + "20" }
              ]}>
                <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
                <Text style={[styles.finalStatusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Attachments Card */}
        {leave.attachments && leave.attachments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attachments</Text>
            {leave.attachments.map((file, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Ionicons name="document-attach" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentName}>{file.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Applied Date */}
        <Text style={styles.appliedDate}>
          Applied on: {new Date(leave.createdAt).toLocaleString()}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.danger,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Stamp styles
  stampContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  approvedStamp: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "10",
  },
  rejectedStamp: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "10",
  },
  stampText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  approvedStampText: {
    color: COLORS.success,
  },
  rejectedStampText: {
    color: COLORS.danger,
  },
  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "30",
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
    flex: 0.4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
    flex: 0.6,
    textAlign: "right",
  },
  // Leave type styles
  leaveTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.6,
    justifyContent: "flex-end",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  leaveTypeText: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
  },
  // Date range styles
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    backgroundColor: COLORS.grayLight + "20",
    padding: 12,
    borderRadius: 12,
  },
  dateArrow: {
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginTop: 4,
  },
  dateValue: {
    fontSize: 13,
    color: COLORS.slateDark,
    fontWeight: "600",
    marginTop: 2,
  },
  halfDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  halfDayText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Reason styles
  reasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.grayLight + "20",
    borderRadius: 12,
  },
  reasonLabel: {
    fontSize: 12,
    color: COLORS.slate,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.slateDark,
    lineHeight: 20,
  },
  // Approval chain styles
  approvalItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "30",
  },
  approvalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  approverInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  approvalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  approverName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  approvalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  approvalStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  approvalDate: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginBottom: 4,
  },
  approvalRemarks: {
    fontSize: 12,
    color: COLORS.slate,
    fontStyle: "italic",
  },
  finalStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  finalStatusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  finalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  finalStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Attachment styles
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight + "20",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 13,
    color: COLORS.slateDark,
    marginLeft: 8,
    flex: 1,
  },
  appliedDate: {
    fontSize: 11,
    color: COLORS.slateLight,
    textAlign: "center",
    marginTop: 8,
  },
});

export default LeaveDetailsScreen;