// screens/teacher/TeacherApprovalsScreen.js
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

const ApprovalCard = ({ leave, onPress }) => {
  const student = leave.applicantId;
  const leaveType = leave.leaveType;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(leave)}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={[styles.avatar, { backgroundColor: "#3B82F620" }]}>
            <Text style={[styles.avatarText, { color: "#3B82F6" }]}>
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
        <View style={[styles.statusBadge, { backgroundColor: "#3B82F6" }]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
          <Text style={styles.statusText}>Approved by You</Text>
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
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Applied: {formatDate(leave.createdAt)}
        </Text>
        <View style={styles.footerRight}>
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text style={styles.waitingText}>
            Waiting for HOD
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TeacherApprovalsScreen = ({ navigation }) => {
  const { approvedLeaves, loading, fetchAllLeaves } = useLeave();
  
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
      "Approved Leave Details",
      `Leave request by ${leave.applicantId?.personalInfo?.firstName} was approved by you and is waiting for HOD approval.`,
      [{ text: "OK" }]
    );
  };

  if (loading && approvedLeaves.length === 0) {
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
            <Text style={styles.headerTitle}>Approved Leaves</Text>
            <Text style={styles.headerSubtitle}>
              {approvedLeaves.length} approved by you
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={approvedLeaves}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ApprovalCard leave={item} onPress={handleLeavePress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leaves approved by you</Text>
            <Text style={styles.emptySubText}>
              Leaves you approve will appear here
            </Text>
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
    backgroundColor: "#daefe552",
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
    shadowColor: "#00ff26",
    shadowOffset: { width: 0, height: 2 },
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waitingText: {
    fontSize: 12,
    color: "#3B82F6",
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
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default TeacherApprovalsScreen;