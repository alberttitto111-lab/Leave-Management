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

      await api.patch(`/teacher/leave-requests/${leaveId}`, {
        action, // "approve" | "reject"
      });

      Alert.alert(
        "Success",
        action === "approve"
          ? "Leave approved and department count updated"
          : "Leave rejected",
      );

      loadRequests();
    } catch (err) {
      console.error("Decision error:", err);
      Alert.alert("Error", "Failed to process leave request");
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const student = item.student;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>
            {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
          </Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>

        <Text style={styles.meta}>From: {item.fromDate}</Text>
        <Text style={styles.meta}>To: {item.toDate}</Text>
        <Text style={styles.reason}>{item.reason}</Text>

        {item.status === "pending" && (
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
          <Text style={styles.empty}>No leave requests found</Text>
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
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: { fontSize: 16, fontWeight: "700" },
  status: { fontSize: 13, fontWeight: "600", textTransform: "uppercase" },

  meta: { fontSize: 13, color: "#555", marginTop: 4 },
  reason: { fontSize: 14, marginTop: 6 },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  approve: { backgroundColor: "#2ecc71" },
  reject: { backgroundColor: "#e74c3c" },

  btnText: { color: "#fff", fontWeight: "600" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    color: "#777",
  },
});
