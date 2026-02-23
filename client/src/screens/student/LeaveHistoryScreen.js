import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { COLORS } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";

const LeaveHistoryScreen = ({ navigation }) => {
  const [leaves, setLeaves] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  const fetchLeaves = async () => {
    try {
      console.log("Fetching leaves...");
      const response = await api.get("/student/leave-history");
      console.log("Fetched leaves:", response.data.data?.length);
      setLeaves(response.data.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load leave history");
    }
  };

  useEffect(() => {
    fetchLeaves();
    
    // Add focus listener to refresh data when tab is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeaves();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  const handleDeletePress = (leaveId) => {
    console.log("Opening delete modal for:", leaveId);
    setLeaveToDelete(leaveId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    console.log("=== CONFIRM DELETE STARTED ===");
    console.log("Leave ID to delete:", leaveToDelete);

    if (!leaveToDelete) {
      console.error("No leave ID set!");
      return;
    }

    try {
      console.log(
        "Making API delete call to:",
        `/student/leave/${leaveToDelete}`,
      );
      const response = await api.delete(`/student/leave/${leaveToDelete}`);

      console.log("API Response:", response.data);

      if (response.data?.success) {
        console.log("Delete successful, updating UI");
        setLeaves((prev) => prev.filter((l) => l._id !== leaveToDelete));
        setDeleteModalVisible(false);
        setLeaveToDelete(null);
        Alert.alert("Success", "Leave deleted successfully");
      } else {
        console.error("Server returned success:false", response.data);
        Alert.alert("Error", response.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("=== API ERROR ===");
      console.error("Error type:", err.name);
      console.error("Error message:", err.message);

      if (err.response) {
        console.error("Server responded with error:");
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        Alert.alert(
          "Server Error",
          err.response?.data?.message || `Error ${err.response.status}`,
        );
      } else if (err.request) {
        console.error("No response received - network error");
        console.error("Request:", err.request);
        Alert.alert(
          "Network Error",
          "Cannot connect to server. Check:\n1. Server is running\n2. Correct API_BASE_URL\n3. Network connection",
        );
      } else {
        console.error("Request setup error:", err.message);
        Alert.alert("Error", "Failed to make request: " + err.message);
      }
    }
  };

  // Filter leaves based on selected tab
  const getFilteredLeaves = () => {
    switch (filter) {
      case "all":
        return leaves; // All leave requests
        
      case "pending":
        return leaves.filter((leave) => 
          leave.finalStatus === "pending" && 
          (leave.status === "pending" || leave.status === "approved_by_teacher")
        ); // Leaves that are still pending (not final)
        
      case "approved":
        return leaves.filter((leave) => 
          leave.finalStatus === "approved" || 
          leave.status === "approved_by_hod"
        ); // Leaves approved by both teacher and HOD
      
      case "rejected":
        return leaves.filter((leave) => 
          leave.finalStatus === "rejected"
        ); // Leaves rejected by either teacher or HOD
        
      default:
        return leaves;
    }
  };

  const getStatusColor = (leave) => {
    if (leave.finalStatus === "approved") return COLORS.success;
    if (leave.finalStatus === "rejected") return COLORS.danger;
    if (leave.status === "approved_by_teacher") return COLORS.info;
    return COLORS.warning;
  };

  const getStatusIcon = (leave) => {
    if (leave.finalStatus === "approved") return "check-circle";
    if (leave.finalStatus === "rejected") return "close-circle";
    if (leave.status === "approved_by_teacher") return "clock-alert";
    return "clock-outline";
  };

  const getStatusText = (leave) => {
    if (leave.finalStatus === "approved") return "APPROVED";
    if (leave.finalStatus === "rejected") return "REJECTED";
    if (leave.status === "approved_by_teacher") return "PENDING HOD";
    return "PENDING";
  };

  const filteredLeaves = getFilteredLeaves();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color= "#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{leaves.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: COLORS.warning }]}>Pending</Text>
          <Text style={styles.summaryValue}>
            {leaves.filter(l => l.finalStatus === "pending").length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Approved</Text>
          <Text style={styles.summaryValue}>
            {leaves.filter(l => l.finalStatus === "approved").length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: COLORS.danger }]}>Rejected</Text>
          <Text style={styles.summaryValue}>
            {leaves.filter(l => l.finalStatus === "rejected").length}
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.content}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {filteredLeaves.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No {filter} leave requests found</Text>
          </View>
        ) : (
          filteredLeaves.map((leave) => (
            <View key={leave._id} style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <View style={styles.leaveTypeContainer}>
                  <Text style={styles.leaveType}>{leave.leaveType?.name}</Text>
                  <Text style={styles.leaveId}>#{leave.requestId}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(leave) + "20" },
                  ]}
                >
                  <Icon
                    name={getStatusIcon(leave)}
                    size={14}
                    color={getStatusColor(leave)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(leave) },
                    ]}
                  >
                    {getStatusText(leave)}
                  </Text>
                </View>
              </View>

              <View style={styles.dateSection}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>
                    {new Date(leave.dateRange?.from).toLocaleDateString()}
                  </Text>
                </View>

                <Icon name="arrow-right" size={20} color={COLORS.slateLight} />

                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>
                    {new Date(leave.dateRange?.to).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.daysBadge}>
                  <Text style={styles.daysText}>{leave.dateRange?.days}d</Text>
                </View>
              </View>

              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{leave.reason}</Text>
              </View>

              {leave.finalStatus === "rejected" && (
                <View style={styles.rejectionSection}>
                  <Icon name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.rejectionText}>
                    {leave.rejectionReason || "No reason provided"}
                  </Text>
                </View>
              )}

              {/* Approval Chain Info */}
              {leave.approvals && leave.approvals.length > 0 && (
                <View style={styles.approvalChain}>
                  <Text style={styles.approvalTitle}>Approval Status:</Text>
                  {leave.approvals.map((approval, idx) => (
                    <View key={idx} style={styles.approvalItem}>
                      <Icon
                        name={approval.status === "approved" ? "check-circle" : "close-circle"}
                        size={14}
                        color={approval.status === "approved" ? COLORS.success : COLORS.danger}
                      />
                      <Text style={styles.approvalText}>
                        {approval.level === 1 ? "Teacher" : "HOD"}: {approval.status}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {leave.attachments?.length > 0 && (
                <View style={styles.attachmentsSection}>
                  <Text style={styles.attachmentsLabel}>Attachments:</Text>
                  <View style={styles.attachmentList}>
                    {leave.attachments.map((file, idx) => (
                      <View key={idx} style={styles.attachmentItem}>
                        <Icon
                          name="file-document"
                          size={16}
                          color={COLORS.primary}
                        />
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {file.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* DELETE BUTTON - Only for pending leaves */}
              {leave.finalStatus === "pending" && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePress(leave._id)}
                >
                  <Icon name="delete" size={16} color={COLORS.white} />
                  <Text style={styles.deleteText}>Delete Request</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.appliedDate}>
                Applied on {new Date(leave.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon
              name="alert"
              size={48}
              color={COLORS.danger}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Delete Leave Request</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this pending leave request? This
              action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  console.log("Modal cancel pressed");
                  setDeleteModalVisible(false);
                  setLeaveToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  console.log("Modal confirm delete pressed");
                  confirmDelete();
                }}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e0e6ee" },

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
    backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.grayLight,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    color: COLORS.slate,
    fontSize: 13,
    fontWeight: "500",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  summaryContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 11,
    color: COLORS.slate,
    marginBottom: 2,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slateDark,
  },

  content: { padding: 20, flex: 1 },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 16,
  },

  leaveCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  leaveTypeContainer: { flex: 1 },

  leaveType: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slateDark,
  },

  leaveId: {
    fontSize: 12,
    color: COLORS.slateLight,
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight + "30",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },

  dateItem: { flex: 1 },

  dateLabel: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginBottom: 2,
  },

  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },

  daysBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  daysText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
  },

  reasonSection: { marginBottom: 12 },

  reasonLabel: {
    fontSize: 12,
    color: COLORS.slateLight,
    marginBottom: 4,
  },

  reasonText: {
    fontSize: 14,
    color: COLORS.slateDark,
    lineHeight: 20,
  },

  rejectionSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.danger + "10",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
  },

  approvalChain: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: COLORS.grayLight + "20",
    borderRadius: 8,
  },

  approvalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate,
    marginBottom: 6,
  },

  approvalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  approvalText: {
    fontSize: 12,
    color: COLORS.slateDark,
  },

  attachmentsSection: { marginBottom: 12 },

  attachmentsLabel: {
    fontSize: 12,
    color: COLORS.slateLight,
    marginBottom: 8,
  },

  attachmentList: { gap: 8 },

  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary + "10",
    padding: 8,
    borderRadius: 8,
  },

  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
  },

  deleteButton: {
    backgroundColor: COLORS.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },

  deleteText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },

  appliedDate: {
    fontSize: 11,
    color: COLORS.slateLight,
    textAlign: "right",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  modalIcon: {
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 12,
  },

  modalText: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: COLORS.grayLight,
  },

  cancelButtonText: {
    color: COLORS.slate,
    fontWeight: "600",
    fontSize: 15,
  },

  confirmButton: {
    backgroundColor: COLORS.danger,
  },

  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
});

export default LeaveHistoryScreen;