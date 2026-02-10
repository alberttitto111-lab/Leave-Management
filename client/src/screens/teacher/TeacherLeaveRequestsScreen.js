// screens/teacher/TeacherLeaveRequestsScreen.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const TeacherLeaveRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await api.get("/teacher/leave-requests");
      console.log("Loaded requests:", res.data.data?.length);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Load leave requests error:", err);
      Alert.alert("Error", "Failed to load leave requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, []);

  const handleDecision = async (leaveId, action) => {
    try {
      setProcessingId(leaveId);

      // Use the correct endpoint based on action
      const endpoint =
        action === "approve"
          ? `/teacher/leaves/${leaveId}/approve`
          : `/teacher/leaves/${leaveId}/reject`;

      await api.post(endpoint, {
        remarks:
          action === "approve"
            ? "Approved by class teacher"
            : "Rejected by class teacher",
      });

      Alert.alert(
        "Success",
        action === "approve"
          ? "Leave approved and forwarded to HOD"
          : "Leave rejected",
      );

      loadRequests();
    } catch (err) {
      console.error("Decision error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to process leave request",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }) => {
    // Fix: Use applicantId instead of student, and dateRange instead of fromDate/toDate
    const student = item.applicantId;
    const leaveType = item.leaveType;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>
            {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.meta}>Type: {leaveType?.name || "N/A"}</Text>
        <Text style={styles.meta}>
          From:{" "}
          {item.dateRange?.from
            ? new Date(item.dateRange.from).toLocaleDateString()
            : "N/A"}
        </Text>
        <Text style={styles.meta}>
          To:{" "}
          {item.dateRange?.to
            ? new Date(item.dateRange.to).toLocaleDateString()
            : "N/A"}
        </Text>
        <Text style={styles.meta}>Days: {item.dateRange?.days || 0}</Text>
        <Text style={styles.reason}>{item.reason}</Text>

        {item.status === "pending" && item.currentLevel === 1 && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.approve]}
              onPress={() => handleDecision(item._id, "approve")}
              disabled={processingId === item._id}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.reject]}
              onPress={() => handleDecision(item._id, "reject")}
              disabled={processingId === item._id}
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {processingId === item._id && (
          <ActivityIndicator style={{ marginTop: 8 }} />
        )}
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "approved_by_teacher":
        return "#3B82F6";
      case "approved":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
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
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.empty}>No pending leave requests</Text>
          </View>
        }
      />
    </View>
  );
};

export default TeacherLeaveRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    margin: 12,
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
    marginBottom: 8,
  },

  name: { fontSize: 16, fontWeight: "700", color: "#1E293B" },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#fff",
  },

  meta: { fontSize: 13, color: "#64748B", marginTop: 4 },

  reason: {
    fontSize: 14,
    marginTop: 8,
    color: "#374151",
    fontStyle: "italic",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
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

  approve: { backgroundColor: "#10B981" },
  reject: { backgroundColor: "#EF4444" },

  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },

  empty: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    color: "#94A3B8",
  },
});
