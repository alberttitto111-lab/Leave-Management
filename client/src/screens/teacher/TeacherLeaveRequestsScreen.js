// screens/teacher/TeacherLeaveRequestsScreen.js
import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const HEADER_HEIGHT = 120;

const TeacherLeaveRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
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

  const renderItem = (item) => {
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
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />

      {/* Fixed Header - Similar to TeacherProfile */}
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
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Scroll Area - Same pattern as TeacherProfile */}
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

          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.empty}>No pending leave requests</Text>
            </View>
          ) : (
            requests.map((item) => (
              <React.Fragment key={item._id}>
                {renderItem(item)}
              </React.Fragment>
            ))
          )}

          {/* Bottom padding for comfortable scrolling */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ebebeb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header styles - matching TeacherProfile pattern
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
  // Scroll content - matching TeacherProfile pattern
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
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
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
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
  meta: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
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
});

export default TeacherLeaveRequestsScreen;