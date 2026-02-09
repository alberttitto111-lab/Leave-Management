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
  }, []);

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

  const filteredLeaves = leaves.filter((leave) =>
    filter === "all" ? true : leave.status === filter,
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return COLORS.success;
      case "pending":
        return COLORS.warning;
      case "rejected":
        return COLORS.danger;
      default:
        return COLORS.slate;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "check-circle";
      case "pending":
        return "clock-outline";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave History</Text>
        <View style={{ width: 24 }} />
      </View>

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

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.content}
      >
        {filteredLeaves.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leave requests found</Text>
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
                    { backgroundColor: getStatusColor(leave.status) + "20" },
                  ]}
                >
                  <Icon
                    name={getStatusIcon(leave.status)}
                    size={14}
                    color={getStatusColor(leave.status)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(leave.status) },
                    ]}
                  >
                    {leave.status?.toUpperCase()}
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

              {leave.status === "rejected" && leave.rejectionReason && (
                <View style={styles.rejectionSection}>
                  <Icon name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.rejectionText}>
                    {leave.rejectionReason}
                  </Text>
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

              {/* DELETE BUTTON */}
              {(leave.status === "pending" ||
                leave.status === "approved_by_teacher") &&
                leave.finalStatus === "pending" && (
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
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
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

  content: { padding: 20 },

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
