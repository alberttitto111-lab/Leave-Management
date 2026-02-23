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
  });
  const [studentInfo, setStudentInfo] = useState({
    class: "N/A",
    section: "N/A",
    rollNumber: "N/A",
    firstName: "",
    lastName: "",
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

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
      fetchStudentProfile();
      fetchDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  // Fetch student profile for real-time updates
  const fetchStudentProfile = useCallback(async () => {
    try {
      const response = await api.get("/student/profile");
      const data = response.data.data || {};
      
      const personalInfo = data.personalInfo || {};
      const academicInfo = data.academicInfo || {};
      
      setStudentInfo({
        class: academicInfo.class || "N/A",
        section: academicInfo.section || "N/A",
        rollNumber: academicInfo.rollNumber || "N/A",
        firstName: personalInfo.firstName || "",
        lastName: personalInfo.lastName || "",
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get("/student/leave-history");
      const leaves = response.data.data || [];
      
      // Calculate stats exactly like in LeaveHistory page
      const pendingCount = leaves.filter(leave => 
        leave.finalStatus === "pending" && 
        (leave.status === "pending" || leave.status === "approved_by_teacher")
      ).length;
      
      const approvedCount = leaves.filter(leave => 
        leave.finalStatus === "approved" || 
        leave.status === "approved_by_hod"
      ).length;
      
      const rejectedCount = leaves.filter(leave => 
        leave.finalStatus === "rejected"
      ).length;
      
      const totalCount = leaves.length;
      
      setStats({
        pendingLeaves: pendingCount,
        approvedLeaves: approvedCount,
        rejectedLeaves: rejectedCount,
        totalLeaves: totalCount,
      });
      
      // Set recent leaves (last 3 requests)
      setRecentLeaves(leaves.slice(0, 3));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
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
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStudentProfile(),
        fetchDashboardData(),
        fetchLeaveTypes()
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUserProfile(),
      fetchStudentProfile(),
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
        // Refresh all data to ensure consistency
        await Promise.all([
          fetchDashboardData(),
          fetchStudentProfile() // Also refresh profile in case anything changed
        ]);
      }

      Alert.alert(
        "Success", 
        "Leave request submitted successfully",
        [{ text: "OK" }],
        { cancelable: true }
      );
      
    } catch (error) {
      console.error("Submit error:", error);
      await fetchDashboardData(); // Refresh to correct state
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

  // Get user's full name from context or studentInfo
  const getFullName = () => {
    if (studentInfo.firstName || studentInfo.lastName) {
      return `${studentInfo.firstName || ""} ${studentInfo.lastName || ""}`.trim();
    }
    if (user?.personalInfo) {
      return `${user.personalInfo.firstName || ""} ${user.personalInfo.lastName || ""}`.trim();
    }
    return "Student";
  };

  // Date Picker Component
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

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
            {/* Class Badge - Now updates in real-time from database */}
            <View style={styles.classBadge}>
              <Icon name="school-outline" size={14} color={COLORS.white} />
              <Text style={styles.classText}>
                Class {studentInfo.class}-{studentInfo.section} | Roll: {studentInfo.rollNumber}
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

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: COLORS.warning }]}
            onPress={() => navigation.navigate("LeaveHistory", { filter: "pending" })}
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
            onPress={() => navigation.navigate("LeaveHistory", { filter: "approved" })}
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
            onPress={() => navigation.navigate("LeaveHistory")}
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
            onPress={() => navigation.navigate("LeaveHistory", { filter: "rejected" })}
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
                <View key={leave._id || index} style={styles.leaveItem}>
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
                        {leave.dateRange?.from ? new Date(leave.dateRange.from).toLocaleDateString() : "N/A"} -{" "}
                        {leave.dateRange?.to ? new Date(leave.dateRange.to).toLocaleDateString() : "N/A"}
                      </Text>
                      <Text style={styles.leaveDays}>
                        {leave.dateRange?.days || 0} day(s)
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

                      {/* <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadLetter(leave._id)}
                      >
                        <Icon name="download" size={16} color={COLORS.primary} />
                        <Text style={styles.downloadText}>
                          Download {leave.finalStatus === "approved" ? "Approval" : "Rejection"} Letter
                        </Text>
                      </TouchableOpacity> */}
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
    <View style={[styles.modalContent, { backgroundColor: "#e9eef0" }]}>
       <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle]}>New Leave Request</Text>
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

        {/* Half Day Leave Button - Styled like leave type buttons */}
        <View style={styles.halfDaySection}>
          <Text style={styles.inputLabel}>Leave Duration</Text>
          <View style={styles.halfDayContainer}>
            <TouchableOpacity
              style={[
                styles.halfDayButton,
                formData.halfDay && styles.halfDayButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, halfDay: !formData.halfDay })}
            >
              <View style={styles.halfDayContent}>
                <Icon 
                  name={formData.halfDay ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={20} 
                  color={formData.halfDay ? COLORS.white : COLORS.slateDark} 
                />
                <Text
                  style={[
                    styles.halfDayButtonText,
                    formData.halfDay && styles.halfDayButtonTextActive,
                  ]}
                >
                  Half Day Leave
                </Text>
              </View>
              {formData.halfDay && (
                <View style={styles.halfDayBadge}>
                  <Text style={styles.halfDayBadgeText}>0.5 day</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Days Calculation */}
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
  container: {
    flex: 1, 
    backgroundColor: "#e4ebf0", 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
  },
  header: { 
    paddingTop: 40, 
    paddingHorizontal: 30, 
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  classText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 30,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: { flex: 1, marginTop: 0 },
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
    marginTop: 10,
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
  
  // Action buttons styles
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
  halfDaySection: {
  marginBottom: 16,
},

halfDayContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
},

halfDayButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: COLORS.grayLight,
  borderWidth: 2,
  borderColor: "transparent",
  minWidth: "100%",
},

halfDayButtonActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},

halfDayContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

halfDayButtonText: {
  fontSize: 14,
  color: COLORS.slateDark,
  fontWeight: "600",
},

halfDayButtonTextActive: {
  color: COLORS.white,
},

halfDayBadge: {
  backgroundColor: "rgba(255,255,255,0.3)",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 16,
},

halfDayBadgeText: {
  color: COLORS.white,
  fontSize: 11,
  fontWeight: "700",
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
    backgroundColor: "#21c518",
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