// screens/HOD/HodLeaveApprovals.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 100;

const HodLeaveApprovals = ({ navigation }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    total: 0
  });

  // State for rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadLeaves = async () => {
    try {
      const res = await api.get("/hod/pending-leaves");
      console.log("Loaded HOD leaves:", res.data);
      
      const leavesData = res.data.data || [];
      
      // Sort by date (newest first)
      leavesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setLeaves(leavesData);
      setStats({
        pending: leavesData.length,
        total: leavesData.length
      });
    } catch (err) {
      console.error("Load HOD leaves error:", err);
      Alert.alert("Error", "Failed to load leave requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeaves();
  }, []);

// In handleApprove function
const handleApprove = async (leaveId) => {
  setProcessingId(leaveId);
  try {
    console.log("Approving leave:", leaveId);
    console.log("API URL:", `/hod/action/${leaveId}`);
    console.log("Payload:", { action: "approve", remark: "Approved by HOD" });
    
    const response = await api.post(`/hod/action/${leaveId}`, {
      action: "approve",
      remark: "Approved by HOD"
    });
    
    console.log("Approve response:", response.data);
    Alert.alert("Success", "Leave approved successfully");
    loadLeaves();
  } catch (err) {
    console.error("Approve error details:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: err.config?.url
    });
    Alert.alert(
      "Error", 
      err.response?.data?.message || "Failed to approve leave"
    );
  } finally {
    setProcessingId(null);
  }
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
    
    try {
      // Use the correct endpoint from your hod.js routes
      await api.post(`/hod/action/${selectedLeaveId}`, {
        action: "reject",
        rejectionReason: rejectionReason.trim() || "Rejected by HOD",
        remark: rejectionReason.trim() || "Rejected by HOD"
      });
      Alert.alert("Success", "Leave rejected");
      loadLeaves();
    } catch (err) {
      console.error("Reject error:", err);
      Alert.alert(
        "Error", 
        err.response?.data?.message || "Failed to reject leave"
      );
    } finally {
      setProcessingId(null);
      setSelectedLeaveId(null);
      setRejectionReason("");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "approved_by_teacher":
        return "#F59E0B"; // Orange for pending HOD approval
      case "approved_by_hod":
        return "#10B981"; // Green for approved
      case "rejected":
      case "rejected_by_hod":
        return "#EF4444"; // Red for rejected
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved_by_teacher":
        return "Pending HOD Approval";
      case "approved_by_hod":
        return "Approved";
      case "rejected":
      case "rejected_by_hod":
        return "Rejected";
      default:
        return status?.replace(/_/g, " ") || "Unknown";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
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
              {item.dateRange?.from ? formatDate(item.dateRange.from) : "N/A"}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#64748B" />
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>
              {item.dateRange?.to ? formatDate(item.dateRange.to) : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>

        {/* Teacher Approval Info */}
        {item.approvals && item.approvals.length > 0 && (
          <View style={styles.approvalInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#12bd20" />
            <Text style={styles.approvalText}>
              Approved by Teacher
            </Text>
          </View>
        )}

        {/* Action Buttons for Pending Leaves */}
        {item.status === "approved_by_teacher" && (
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
                  <Text style={styles.btnText}>Accept</Text>
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.hod || "#6366F1"} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ede9e9" />

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor:"#d72c2c" }]}>
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
              {stats.pending} pending approval
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Scroll Area */}
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        indicatorStyle="black"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Spacer for fixed header */}
        <View style={{ height: HEADER_HEIGHT + 20 }} />

        {/* Status Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: "#ffa50a" }]}>
            <Text style={styles.summaryNumber}>{stats.pending}</Text>
            <Text style={styles.summaryLabel}>Pending Approval</Text>
          </View>
        </View>

        {leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.empty}>No pending leave approvals</Text>
          </View>
        ) : (
          leaves.map((item) => (
            <React.Fragment key={item._id}>
              {renderItem(item)}
            </React.Fragment>
          ))
        )}

        {/* Bottom padding for comfortable scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>

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
    backgroundColor: "#eee1e1",
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
    shadowColor: "#ffff00",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
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
  approvalInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  approvalText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "500",
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

export default HodLeaveApprovals;