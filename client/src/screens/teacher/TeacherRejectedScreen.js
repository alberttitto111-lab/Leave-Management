// screens/teacher/TeacherRejectedScreen.js
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLeave } from "../../contexts/LeaveContext";

const HEADER_HEIGHT = 100;

const RejectedCard = ({ leave, onPress }) => {
  const student = leave.applicantId;
  const leaveType = leave.leaveType;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Find rejection reason
  const getRejectionReason = () => {
    if (leave.rejectionReason) return leave.rejectionReason;
    const rejection = leave.approvals?.find(a => a.status === "rejected");
    return rejection?.remarks || "No reason provided";
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(leave)}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={[styles.avatar, { backgroundColor: "#EF444420" }]}>
            <Text style={[styles.avatarText, { color: "#EF4444" }]}>
              {student?.personalInfo?.firstName?.[0] || ""}
              {student?.personalInfo?.lastName?.[0] || ""}
            </Text>
          </View>
          <View>
            <Text style={styles.studentName}>
              {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
            </Text>
            <Text style={styles.studentId}>{student?.userId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: "#EF4444" }]}>
          <Ionicons name="close" size={12} color="#fff" />
          <Text style={styles.statusText}>Rejected</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {formatDate(leave.dateRange?.from)} - {formatDate(leave.dateRange?.to)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={16} color="#64748B" />
          <Text style={styles.infoText}>{leaveType?.name || "Leave"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color="#64748B" />
          <Text style={styles.infoText}>{leave.dateRange?.days} day(s)</Text>
        </View>
        <Text style={styles.reason} numberOfLines={2}>
          "{leave.reason}"
        </Text>
        
        {/* Rejection Reason */}
        <View style={styles.rejectionSection}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.rejectionText} numberOfLines={2}>
            {getRejectionReason()}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Applied: {formatDate(leave.createdAt)}
        </Text>
        {leave.rejectedAt && (
          <Text style={styles.rejectedDateText}>
            Rejected: {formatDate(leave.rejectedAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const TeacherRejectedScreen = ({ navigation }) => {
  const { rejectedLeaves, loading, fetchAllLeaves } = useLeave();
  
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchAllLeaves();
    
    // Add focus listener to refresh when tab is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllLeaves();
    });

    return unsubscribe;
  }, [navigation, fetchAllLeaves]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllLeaves();
    setRefreshing(false);
  };

  const handleLeavePress = (leave) => {
    Alert.alert(
      "Rejected Leave Details",
      `Leave request by ${leave.applicantId?.personalInfo?.firstName} was rejected.`,
      [{ text: "OK" }]
    );
  };

  if (loading && rejectedLeaves.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#0D9488" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Rejected Leaves</Text>
            <Text style={styles.headerSubtitle}>
              {rejectedLeaves.length} rejected
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={rejectedLeaves}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RejectedCard leave={item} onPress={handleLeavePress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="close-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No rejected leaves</Text>
          </View>
        }
      />
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    flex: 1,
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
    color: "#1E293B",
  },
  studentId: {
    fontSize: 12,
    color: "#64748B",
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
    fontSize: 10,
    fontWeight: "600",
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
  reason: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
    marginTop: 8,
    lineHeight: 20,
  },
  rejectionSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: "#EF4444",
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
  rejectedDateText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
});

export default TeacherRejectedScreen;