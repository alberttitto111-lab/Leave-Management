// screens/teacher/TeacherLeaveHistoryScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const FilterChip = ({ label, count, active, onPress, color }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      active && { backgroundColor: color, borderColor: color },
    ]}
    onPress={onPress}
  >
    <Text
      style={[styles.filterChipText, active && styles.filterChipTextActive]}
    >
      {label}
    </Text>
    <View
      style={[
        styles.countBadge,
        active && { backgroundColor: "rgba(255,255,255,0.3)" },
      ]}
    >
      <Text style={[styles.countBadgeText, active && { color: "#fff" }]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

const LeaveCard = ({
  leave,
  onPress,
  showActions,
  onApprove,
  onReject,
  processingId,
}) => {
  const student = leave.applicantId;
  const leaveType = leave.leaveType;

  const getStatusConfig = (status, finalStatus) => {
    if (finalStatus === "approved" || status.includes("approved")) {
      return { color: "#10B981", label: "Approved", icon: "checkmark-circle" };
    }
    if (finalStatus === "rejected" || status === "rejected") {
      return { color: "#EF4444", label: "Rejected", icon: "close-circle" };
    }
    if (status === "pending") {
      return { color: "#F59E0B", label: "Pending", icon: "time" };
    }
    return {
      color: "#6B7280",
      label: status.replace(/_/g, " "),
      icon: "help-circle",
    };
  };

  const statusConfig = getStatusConfig(leave.status, leave.finalStatus);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(leave)}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: statusConfig.color + "20" },
            ]}
          >
            <Text style={[styles.avatarText, { color: statusConfig.color }]}>
              {student?.personalInfo?.firstName?.[0]}
              {student?.personalInfo?.lastName?.[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.studentName}>
              {student?.personalInfo?.firstName}{" "}
              {student?.personalInfo?.lastName}
            </Text>
            <Text style={styles.studentId}>{student?.userId}</Text>
          </View>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}
        >
          <Ionicons name={statusConfig.icon} size={12} color="#fff" />
          <Text style={styles.statusText}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {new Date(leave.dateRange?.from).toLocaleDateString()} -{" "}
            {new Date(leave.dateRange?.to).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={16} color="#64748B" />
          <Text style={styles.infoText}>{leaveType?.name || "Leave"}</Text>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: leaveType?.color || "#3B82F6" },
            ]}
          />
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#64748B" />
          <Text style={styles.infoText}>{leave.dateRange?.days} day(s)</Text>
        </View>

        <Text style={styles.reason} numberOfLines={2}>
          "{leave.reason}"
        </Text>

        {leave.approvals?.length > 0 && (
          <View style={styles.approvalChain}>
            <Text style={styles.approvalTitle}>Approval Chain:</Text>
            {leave.approvals.map((approval, idx) => (
              <View key={idx} style={styles.approvalItem}>
                <Ionicons
                  name={approval.status === "approved" ? "checkmark" : "close"}
                  size={14}
                  color={approval.status === "approved" ? "#10B981" : "#EF4444"}
                />
                <Text style={styles.approvalText}>
                  {approval.approverId?.personalInfo?.firstName || "Unknown"} (
                  {approval.approverId?.role}){" - "}
                  {approval.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {showActions &&
        leave.status === "pending" &&
        leave.currentLevel === 1 && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(leave._id)}
              disabled={processingId === leave._id}
            >
              {processingId === leave._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => onReject(leave._id)}
              disabled={processingId === leave._id}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Applied: {new Date(leave.createdAt).toLocaleDateString()}
        </Text>
        {leave.finalStatus !== "pending" && (
          <Text
            style={[
              styles.finalStatus,
              {
                color: leave.finalStatus === "approved" ? "#10B981" : "#EF4444",
              },
            ]}
          >
            Final: {leave.finalStatus.toUpperCase()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const LeaveDetailModal = ({ visible, leave, onClose, onApprove, onReject }) => {
  if (!leave) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Leave Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Full details here */}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const TeacherLeaveHistoryScreen = ({ navigation }) => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needsMyApproval: 0,
  });

  const filters = [
    { key: "all", label: "All", color: "#7C3AED" },
    { key: "needsApproval", label: "Needs Action", color: "#F59E0B" },
    { key: "pending", label: "Pending", color: "#3B82F6" },
    { key: "approved", label: "Approved", color: "#10B981" },
    { key: "rejected", label: "Rejected", color: "#EF4444" },
  ];

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/teacher/leaves/history-30days");

      const data = res.data.data || [];
      const grouped = res.data.grouped || {};
      const sum = res.data.summary || {};

      setLeaves(data);
      setSummary(sum);

      // Apply initial filter
      applyFilter(activeFilter, data, grouped);
    } catch (err) {
      console.error("Load leaves error:", err);
      Alert.alert("Error", "Failed to load leave history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (filterKey, data = leaves, grouped = null) => {
    setActiveFilter(filterKey);

    if (filterKey === "all") {
      setFilteredLeaves(data);
    } else if (grouped && grouped[filterKey]) {
      setFilteredLeaves(grouped[filterKey]);
    } else {
      // Fallback filtering
      const filtered = data.filter((leave) => {
        if (filterKey === "needsApproval") {
          return leave.status === "pending" && leave.currentLevel === 1;
        }
        if (filterKey === "approved") {
          return (
            leave.finalStatus === "approved" ||
            leave.status.includes("approved")
          );
        }
        if (filterKey === "rejected") {
          return (
            leave.finalStatus === "rejected" || leave.status === "rejected"
          );
        }
        return leave.status === filterKey;
      });
      setFilteredLeaves(filtered);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeaves();
  }, []);

  const handleApprove = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      await api.post(`/teacher/leaves/${leaveId}/approve`, {
        remarks: "Approved by class teacher",
      });
      Alert.alert("Success", "Leave approved and forwarded to HOD");
      loadLeaves();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (leaveId) => {
    Alert.prompt(
      "Reject Leave",
      "Enter reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            try {
              setProcessingId(leaveId);
              await api.post(`/teacher/leaves/${leaveId}/reject`, {
                reason: reason || "Rejected by class teacher",
              });
              Alert.alert("Success", "Leave rejected");
              loadLeaves();
            } catch (err) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to reject",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const openDetail = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const getFilterCount = (key) => {
    if (key === "all") return summary.total;
    if (key === "needsApproval") return summary.needsMyApproval;
    if (key === "pending") return summary.pending;
    if (key === "approved") return summary.approved;
    if (key === "rejected") return summary.rejected;
    return 0;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave History (30 Days)</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total Requests</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7" }]}>
          <Text style={[styles.summaryNumber, { color: "#D97706" }]}>
            {summary.needsMyApproval}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#B45309" }]}>
            Need Action
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            count={getFilterCount(filter.key)}
            active={activeFilter === filter.key}
            onPress={() => applyFilter(filter.key)}
            color={filter.color}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filteredLeaves}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LeaveCard
            leave={item}
            onPress={openDetail}
            showActions={
              activeFilter === "needsApproval" || activeFilter === "pending"
            }
            onApprove={handleApprove}
            onReject={handleReject}
            processingId={processingId}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leave requests found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <LeaveDetailModal
        visible={modalVisible}
        leave={selectedLeave}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  studentId: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  reason: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 20,
  },
  approvalChain: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  approvalTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  approvalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  approvalText: {
    fontSize: 12,
    color: "#4B5563",
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: "#10B981",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  finalStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    padding: 20,
  },
});

export default TeacherLeaveHistoryScreen;
