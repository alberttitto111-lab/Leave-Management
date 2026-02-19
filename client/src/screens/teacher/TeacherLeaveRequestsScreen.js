// screens/teacher/TeacherLeaveRequestsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLeave } from "../../contexts/LeaveContext";

const HEADER_HEIGHT = 120;

const TeacherLeaveRequestsScreen = ({ navigation }) => {
  const { 
    pendingLeaves, 
    approvedLeaves, 
    stats, 
    loading, 
    approveLeave, 
    rejectLeave,
    fetchAllLeaves 
  } = useLeave();
  
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // State for rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllLeaves();
    setRefreshing(false);
  };

  const handleApprove = async (leaveId) => {
    setProcessingId(leaveId);
    const result = await approveLeave(leaveId);
    if (result.success) {
      Alert.alert("Success", "Leave approved and forwarded to HOD");
    } else {
      Alert.alert("Error", result.message);
    }
    setProcessingId(null);
  };

  const openRejectModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedLeaveId) return;
    
    setRejectModalVisible(false);
    setProcessingId(selectedLeaveId);
    
    const result = await rejectLeave(selectedLeaveId, rejectionReason.trim() || "Rejected by teacher");
    
    if (result.success) {
      Alert.alert("Success", "Leave rejected");
    } else {
      Alert.alert("Error", result.message);
    }
    
    setProcessingId(null);
    setSelectedLeaveId(null);
    setRejectionReason("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "approved_by_teacher":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved_by_teacher":
        return "Approved by Teacher";
      default:
        return status?.replace(/_/g, " ") || "Unknown";
    }
  };

  const renderItem = (item) => {
    const student = item.applicantId;
    const leaveType = item.leaveType;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.studentInfoContainer}>
            <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + "20" }]}>
              <Text style={[styles.avatarText, { color: getStatusColor(item.status) }]}>
                {student?.personalInfo?.firstName?.[0] || ""}
                {student?.personalInfo?.lastName?.[0] || ""}
              </Text>
            </View>
            <View>
              <Text style={styles.name}>
                {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
              </Text>
              <Text style={styles.studentId}>{student?.userId}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.leaveDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{leaveType?.name || "N/A"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Days:</Text>
            <Text style={styles.detailValue}>{item.dateRange?.days || 0} day(s)</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>
              {item.dateRange?.from ? new Date(item.dateRange.from).toLocaleDateString() : "N/A"}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>
              {item.dateRange?.to ? new Date(item.dateRange.to).toLocaleDateString() : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>

        {item.status === "pending" && item.currentLevel === 1 && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.approve]}
              onPress={() => handleApprove(item._id)}
              disabled={processingId === item._id}
            >
              {processingId === item._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.btnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.reject]}
              onPress={() => openRejectModal(item._id)}
              disabled={processingId === item._id}
            >
              {processingId === item._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={styles.btnText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {item.status === "approved_by_teacher" && (
          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.infoMessageText}>
              Already approved by you. Waiting for HOD approval.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Combine pending and approved leaves for display
  const allRequests = [...pendingLeaves, ...approvedLeaves];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: "#0D9488" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Leave Requests</Text>
            <Text style={styles.headerSubtitle}>
              {stats.pending} pending | {stats.approved} approved
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Scroll Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle="black"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Spacer for fixed header */}
          <View style={{ height: HEADER_HEIGHT + 20 }} />

          {/* Status Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={styles.summaryNumber}>{stats.pending}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: "#3B82F6" }]}>
              <Text style={styles.summaryNumber}>{stats.approved}</Text>
              <Text style={styles.summaryLabel}>Approved by You</Text>
            </View>
          </View>

          {loading && allRequests.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0D9488" />
            </View>
          ) : allRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.empty}>No pending leave requests</Text>
            </View>
          ) : (
            <>
              {/* Section for Pending Requests */}
              {pendingLeaves.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pending Approval</Text>
                  </View>
                  {pendingLeaves.map((item) => (
                    <React.Fragment key={item._id}>
                      {renderItem(item)}
                    </React.Fragment>
                  ))}
                </>
              )}
              
              {/* Section for Approved by Teacher Requests */}
              {approvedLeaves.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Approved - Waiting for HOD</Text>
                  </View>
                  {approvedLeaves.map((item) => (
                    <React.Fragment key={item._id}>
                      {renderItem(item)}
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          )}

          {/* Bottom padding for comfortable scrolling */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Leave</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Reason for rejection</Text>
            <TextInput
              style={styles.modalInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalConfirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#daefe552",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  studentId: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#fff",
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
    width: 45,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "500",
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  reason: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  approve: {
    backgroundColor: "#10B981",
  },
  reject: {
    backgroundColor: "#EF4444",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  infoMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F620",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 13,
    color: "#3B82F6",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  empty: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    color: "#94A3B8",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  modalConfirmButton: {
    backgroundColor: "#EF4444",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default TeacherLeaveRequestsScreen;