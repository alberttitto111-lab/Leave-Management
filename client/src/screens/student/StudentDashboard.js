// screens/student/StudentDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
  Linking,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

const StudentDashboard = ({ navigation, route }) => {
  const { user, logout, token, refreshUserProfile } = useAuth();
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    totalLeaves: 0,
    class: "N/A",
    section: "N/A",
    rollNumber: "N/A",
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Leave Request Form State
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    fromDate: new Date(),
    toDate: new Date(),
    reason: "",
    halfDay: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle navigation params to open modal
  useEffect(() => {
    if (route.params?.openLeaveModal) {
      setModalVisible(true);
      navigation.setParams({ openLeaveModal: undefined });
    }
  }, [route.params?.openLeaveModal]);

  // Listen for focus events to refresh profile data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUserProfile();
      fetchDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get("/student/dashboard-stats");
      const data = response.data.data || {};
      
      const rejectedCount = (data.recentLeaves || []).filter(
        leave => leave.finalStatus === "rejected"
      ).length;
      
      const totalLeaves = (data.pendingLeaves || 0) + (data.approvedLeaves || 0) + rejectedCount;
      
      setStats({
        pendingLeaves: data.pendingLeaves || 0,
        approvedLeaves: data.approvedLeaves || 0,
        rejectedLeaves: rejectedCount,
        totalLeaves: totalLeaves,
        class: data.class || "N/A",
        section: data.section || "N/A",
        rollNumber: data.rollNumber || "N/A",
      });
      setRecentLeaves(data.recentLeaves || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await api.get("/student/leave-types");
      const types = response.data.data || [];
      setLeaveTypes(types);
    } catch (error) {
      console.error("Leave types fetch error:", error);
      Alert.alert("Error", "Failed to load leave types");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchLeaveTypes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUserProfile(),
      fetchDashboardData(),
      fetchLeaveTypes()
    ]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const calculateDays = () => {
    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);

    if (end < start) return 0;

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return formData.halfDay ? 0.5 : diffDays;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveTypeId || formData.leaveTypeId === "") {
      newErrors.leaveType = "Please select a leave type";
    }

    if (!formData.reason || formData.reason.trim() === "") {
      newErrors.reason = "Please enter a reason";
    }

    if (formData.toDate < formData.fromDate) {
      newErrors.dates = "End date cannot be before start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitLeave = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    const selectedLeaveType = leaveTypes.find(t => t._id === formData.leaveTypeId);
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const optimisticLeave = {
      _id: tempId,
      leaveType: selectedLeaveType,
      dateRange: {
        from: formData.fromDate,
        to: formData.toDate,
        days: calculateDays(),
      },
      reason: formData.reason,
      status: "pending",
      finalStatus: "pending",
    };

    setRecentLeaves(prev => [optimisticLeave, ...prev].slice(0, 5));
    setStats(prev => ({
      ...prev,
      pendingLeaves: prev.pendingLeaves + 1,
      totalLeaves: prev.totalLeaves + 1,
    }));

    setModalVisible(false);
    resetForm();

    try {
      const payload = {
        leaveTypeId: formData.leaveTypeId.toString(),
        fromDate: formData.fromDate.toISOString(),
        toDate: formData.toDate.toISOString(),
        reason: formData.reason.trim(),
        halfDay: formData.halfDay,
        days: calculateDays(),
      };

      const response = await api.post("/student/leave-request", payload);
      
      if (response.data?.data) {
        setRecentLeaves(prev => {
          const filtered = prev.filter(l => l._id !== tempId);
          return [response.data.data, ...filtered].slice(0, 5);
        });

        Alert.alert(
          "Success", 
          "Leave request submitted successfully",
          [{ text: "OK" }],
          { cancelable: true }
        );
      }
      
    } catch (error) {
      console.error("Submit error:", error);
      setRecentLeaves(prev => prev.filter(l => l._id !== tempId));
      setStats(prev => ({
        ...prev,
        pendingLeaves: prev.pendingLeaves - 1,
        totalLeaves: prev.totalLeaves - 1,
      }));
      fetchDashboardData();
      Alert.alert("Error", error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveTypeId: "",
      fromDate: new Date(),
      toDate: new Date(),
      reason: "",
      halfDay: false,
    });
    setErrors({});
  };

  const downloadLetter = async (leaveId) => {
    try {
      const response = await api.get(`/student/download-letter/${leaveId}`);
      const { url, type } = response.data;

      const fullUrl = `${api.defaults.baseURL}${url}`;

      if (Platform.OS === "web") {
        Linking.openURL(fullUrl);
      } else {
        const fileName = url.split("/").pop();
        const downloadPath = `${FileSystem.documentDirectory}${fileName}`;

        const downloadResumable = FileSystem.createDownloadResumable(
          fullUrl,
          downloadPath,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const { uri } = await downloadResumable.downloadAsync();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Downloaded", `File saved to ${uri}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download letter");
    }
  };

  const getStatusColor = (status, finalStatus) => {
    if (finalStatus === "approved") return COLORS.success;
    if (finalStatus === "rejected") return COLORS.danger;
    if (status === "approved_by_teacher") return COLORS.info;
    return COLORS.warning;
  };

  const getStatusText = (leave) => {
    if (leave.finalStatus === "approved") return "Approved";
    if (leave.finalStatus === "rejected") return "Rejected";
    if (leave.status === "approved_by_teacher") return "Pending HOD";
    return "Pending";
  };

  const quickActions = [
    {
      title: "Apply Leave",
      icon: "calendar-plus",
      action: () => setModalVisible(true),
      color: "#c21c3a" ,
    },
    {
      title: "Leave History",
      icon: "history",
      action: () => navigation.navigate("LeaveHistory"),
      color: "#662fdc",
    },
    {
      title: "Edit Profile",
      icon: "account-edit",
      action: () => navigation.navigate("EditStudentProfile"),
      color: "#45b15a",
    },
  ];

  const getFullName = () => {
    if (user?.personalInfo) {
      return `${user.personalInfo.firstName || ""} ${user.personalInfo.lastName || ""}`.trim();
    }
    return "Student";
  };

  const DatePickerField = ({ label, date, onChange, error }) => {
    const [showPicker, setShowPicker] = useState(false);

    if (Platform.OS === "web") {
      return (
        <View style={styles.dateField}>
          <Text style={styles.inputLabel}>{label} *</Text>
          <input
            type="date"
            value={date.toISOString().split("T")[0]}
            onChange={(e) => onChange(new Date(e.target.value))}
            style={{
              width: "95%",
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${error ? COLORS.danger : "#c2c3c4"}`,
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );
    }

    return (
      <View style={styles.dateField}>
        <Text style={styles.inputLabel}>{label} *</Text>
        <TouchableOpacity
          style={[styles.dateButton, error && { borderColor: COLORS.danger }]}
          onPress={() => setShowPicker(true)}
        >
          <Icon name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) onChange(selectedDate);
            }}
          />
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const getStringId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.toString) return id.toString();
    return String(id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {getFullName()}
            </Text>
            <View style={styles.classBadge}>
              <Text style={styles.classText}>
                Class {stats.class}-{stats.section} | Roll: {stats.rollNumber}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickActionButton,
                { backgroundColor: action.color },
              ]}
              onPress={action.action}
            >
              <Icon name={action.icon} size={24} color={COLORS.white} />
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.warning }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.warning + "20" },
              ]}
            >
              <Icon name="clock-outline" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{stats.pendingLeaves}</Text>
            <Text style={styles.statTitle}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.success }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.success + "20" },
              ]}
            >
              <Icon
                name="check-circle-outline"
                size={24}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.statValue}>{stats.approvedLeaves}</Text>
            <Text style={styles.statTitle}>Approved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.primary }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.primary + "20" },
              ]}
            >
              <Icon name="calendar-month" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalLeaves}</Text>
            <Text style={styles.statTitle}>Total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.danger }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.danger + "20" },
              ]}
            >
              <Icon name="close-circle" size={24} color={COLORS.danger} />
            </View>
            <Text style={styles.statValue}>{stats.rejectedLeaves}</Text>
            <Text style={styles.statTitle}>Rejected</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Leaves with Download and View Form Buttons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("LeaveHistory")}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.leavesContainer}>
            {recentLeaves.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="calendar-blank" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No recent requests</Text>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.applyButtonText}>Apply for Leave</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentLeaves.map((leave, index) => (
                <View key={index} style={styles.leaveItem}>
                  <View style={styles.leaveMain}>
                    <View
                      style={[
                        styles.leaveIconContainer,
                        {
                          backgroundColor:
                            getStatusColor(leave.status, leave.finalStatus) +
                            "20",
                        },
                      ]}
                    >
                      <Icon
                        name={
                          leave.finalStatus === "approved"
                            ? "check"
                            : leave.finalStatus === "rejected"
                              ? "close"
                              : "clock-outline"
                        }
                        size={20}
                        color={getStatusColor(leave.status, leave.finalStatus)}
                      />
                    </View>
                    <View style={styles.leaveContent}>
                      <Text style={styles.leaveType}>
                        {leave.leaveType?.name}
                      </Text>
                      <Text style={styles.leaveDates}>
                        {new Date(leave.dateRange?.from).toLocaleDateString()} -{" "}
                        {new Date(leave.dateRange?.to).toLocaleDateString()}
                      </Text>
                      <Text style={styles.leaveDays}>
                        {leave.dateRange?.days} day(s)
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(leave.status, leave.finalStatus) +
                            "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: getStatusColor(
                              leave.status,
                              leave.finalStatus,
                            ),
                          },
                        ]}
                      >
                        {getStatusText(leave)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons for Approved/Rejected Leaves */}
                  {(leave.finalStatus === "approved" ||
                    leave.finalStatus === "rejected") && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.viewFormButton}
                        onPress={() => navigation.navigate("LeaveDetails", { leaveId: leave._id })}
                      >
                        <Icon name="file-document-outline" size={16} color={COLORS.info} />
                        <Text style={styles.viewFormText}>View Form</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadLetter(leave._id)}
                      >
                        <Icon name="download" size={16} color={COLORS.primary} />
                        <Text style={styles.downloadText}>
                          Download {leave.finalStatus === "approved" ? "Approval" : "Rejection"} Letter
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal for New Leave Request */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Leave Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.slateDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Leave Type *</Text>
              <View style={styles.leaveTypeContainer}>
                {leaveTypes.length === 0 ? (
                  <View style={styles.noTypesContainer}>
                    <Icon
                      name="alert-circle"
                      size={24}
                      color={COLORS.warning}
                    />
                    <Text style={styles.noTypesText}>
                      No leave types available
                    </Text>
                  </View>
                ) : (
                  leaveTypes.map((type) => {
                    const typeId = getStringId(type._id);
                    const isSelected = formData.leaveTypeId === typeId;

                    return (
                      <TouchableOpacity
                        key={typeId}
                        style={[
                          styles.leaveTypeButton,
                          isSelected && styles.leaveTypeButtonActive,
                          errors.leaveType && !isSelected && styles.inputError,
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, leaveTypeId: typeId });
                          setErrors({ ...errors, leaveType: null });
                        }}
                      >
                        <View style={styles.leaveTypeContent}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: type.color || COLORS.primary },
                            ]}
                          />
                          <Text
                            style={[
                              styles.leaveTypeText,
                              isSelected && styles.leaveTypeTextActive,
                            ]}
                          >
                            {type.name}
                          </Text>
                        </View>
                        {type.maxDaysPerYear > 0 && (
                          <Text
                            style={[
                              styles.leaveTypeSubtext,
                              isSelected && styles.leaveTypeTextActive,
                            ]}
                          >
                            Max: {type.maxDaysPerYear}/year
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
              {errors.leaveType && (
                <Text style={styles.errorText}>{errors.leaveType}</Text>
              )}

              <View style={styles.dateContainer}>
                <DatePickerField
                  label="From Date"
                  date={formData.fromDate}
                  onChange={(date) => {
                    setFormData({ ...formData, fromDate: date });
                    setErrors({ ...errors, dates: null });
                  }}
                  error={errors.dates}
                />
                <DatePickerField
                  label="To Date"
                  date={formData.toDate}
                  onChange={(date) => {
                    setFormData({ ...formData, toDate: date });
                    setErrors({ ...errors, dates: null });
                  }}
                  error={errors.dates}
                />
              </View>

              <TouchableOpacity
                style={styles.halfDayContainer}
                onPress={() =>
                  setFormData({ ...formData, halfDay: !formData.halfDay })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.halfDay && styles.checkboxActive,
                  ]}
                >
                  {formData.halfDay && (
                    <Icon name="check" size={16} color={COLORS.white} />
                  )}
                </View>
                <Text style={styles.halfDayText}>Half Day Leave</Text>
              </TouchableOpacity>

              <View style={styles.daysCalculation}>
                <Text style={styles.daysLabel}>Total Days:</Text>
                <Text style={styles.daysValue}>{calculateDays()}</Text>
              </View>

              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[
                  styles.reasonInput,
                  errors.reason && { borderColor: COLORS.danger },
                ]}
                multiline
                numberOfLines={4}
                placeholder="Enter reason for leave..."
                value={formData.reason}
                onChangeText={(text) => {
                  setFormData({ ...formData, reason: text });
                  setErrors({ ...errors, reason: null });
                }}
              />
              {errors.reason && (
                <Text style={styles.errorText}>{errors.reason}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (submitting ||
                    calculateDays() === 0 ||
                    !formData.leaveTypeId) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitLeave}
                disabled={
                  submitting || calculateDays() === 0 || !formData.leaveTypeId
                }
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 80 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: 14, color: COLORS.white, opacity: 0.8 },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 4,
  },
  classBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  classText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: { flex: 1, marginTop: -60 },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 60,
    paddingVertical: 5,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: COLORS.slateDark },
  statTitle: { fontSize: 12, color: COLORS.slate, marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  leavesContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  leaveItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "50",
    paddingVertical: 12,
  },
  leaveMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  leaveIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaveContent: { flex: 1 },
  leaveType: { fontSize: 14, fontWeight: "600", color: COLORS.slateDark },
  leaveDates: { fontSize: 12, color: COLORS.slate, marginTop: 2 },
  leaveDays: { fontSize: 11, color: COLORS.slateLight, marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  
  // New styles for action buttons
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  viewFormButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.info + "10",
    borderRadius: 8,
    flex: 0.4,
    justifyContent: "center",
  },
  viewFormText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.info,
    fontWeight: "600",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 8,
    flex: 0.6,
    justifyContent: "center",
  },
  downloadText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#94A3B8", fontSize: 14, marginTop: 8, marginBottom: 16 },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  applyButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slateDark,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
    marginBottom: 8,
  },
  leaveTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  leaveTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: "45%",
  },
  leaveTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  leaveTypeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  leaveTypeText: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
  },
  leaveTypeTextActive: {
    color: COLORS.white,
  },
  leaveTypeSubtext: {
    fontSize: 11,
    color: COLORS.slate,
    marginTop: 2,
    marginLeft: 20,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 2,
  },
  noTypesContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.warning + "20",
    borderRadius: 12,
    width: "100%",
  },
  noTypesText: {
    marginLeft: 8,
    color: COLORS.warning,
    fontSize: 14,
  },
  dateContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateField: { flex: 1 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.slateDark,
  },
  halfDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  halfDayText: {
    fontSize: 14,
    color: COLORS.slateDark,
  },
  daysCalculation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  daysLabel: {
    fontSize: 14,
    color: COLORS.slate,
  },
  daysValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.slateDark,
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
});

export default StudentDashboard;