// screens/HOD/HODStudentDetail.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 100;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const HodStudentDetail = ({ route, navigation }) => {
  const { studentId } = route.params;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hod/students/${studentId}`);
      console.log("HOD Student data:", JSON.stringify(res.data.data, null, 2));
      setStudent(res.data.data);
    } catch (err) {
      console.error("Failed to load student:", err);
      Alert.alert("Error", "Failed to load student details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudent();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d13030" />
        <Text style={{ marginTop: 10 }}>Loading student details...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#CBD5E1" />
        <Text style={{ marginTop: 10 }}>Student not found</Text>
      </View>
    );
  }

  const p = student.personalInfo || {};
  const a = student.academicInfo || {};
  
  // Safe access to department data
  const department = student.departmentId || {};
  const departmentName = typeof department === 'object' ? department.name : null;
  const departmentCode = typeof department === 'object' ? department.code : null;

  // Format date of birth
  const formatDateOfBirth = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return "N/A";
    }
  };

  // Format gender
  const formatGender = (gender) => {
    if (!gender) return "N/A";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13030" />

      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#d13030" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Student Profile</Text>
            <Text style={styles.headerSubtitle}>
              {p.firstName || ""} {p.lastName || ""}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Scroll Area */}
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        indicatorStyle="black"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#d13030"]}
            tintColor="#d13030"
          />
        }
      >
        {/* Spacer for fixed header */}
        <View style={{ height: HEADER_HEIGHT + 10 }} />

        {/* Account Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Account Information" />
          <InfoRow label="User ID" value={student.userId} />
          <InfoRow label="Role" value={student.role} />
          <InfoRow label="Status" value={student.isActive ? "Active" : "Inactive"} />
          <InfoRow 
            label="Last Login" 
            value={student.lastLogin ? new Date(student.lastLogin).toLocaleString() : "Never"} 
          />
          <InfoRow 
            label="Member Since" 
            value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A"} 
          />
        </View>

        {/* Academic Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Academic Information" />
          <InfoRow label="Roll Number" value={a.rollNumber} />
          <InfoRow label="Class" value={a.class} />
          <InfoRow label="Section" value={a.section} />
          <InfoRow label="Batch Year" value={a.batchYear?.toString()} />
        </View>

        {/* Department Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Department" />
          <InfoRow label="Department Name" value={departmentName || "Not Assigned"} />
          {departmentCode && (
            <InfoRow label="Department Code" value={departmentCode} />
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Personal Information" />
          <InfoRow label="First Name" value={p.firstName} />
          <InfoRow label="Last Name" value={p.lastName} />
          <InfoRow label="Email" value={p.email} />
          <InfoRow label="Phone" value={p.phone} />
          <InfoRow label="Date of Birth" value={formatDateOfBirth(p.dateOfBirth)} />
          <InfoRow label="Gender" value={formatGender(p.gender)} />
          <InfoRow label="Address" value={p.address} />
        </View>

        {/* Parent/Guardian Information (if available) */}
        {/* {a.parentDetails && (
          <View style={styles.formCard}>
            <SectionHeader title="Parent / Guardian Information" />
            {a.parentDetails.fatherName && (
              <InfoRow label="Father's Name" value={a.parentDetails.fatherName} />
            )}
            {a.parentDetails.motherName && (
              <InfoRow label="Mother's Name" value={a.parentDetails.motherName} />
            )}
            {a.parentDetails.parentPhone && (
              <InfoRow label="Parent Phone" value={a.parentDetails.parentPhone} />
            )}
            {a.parentDetails.parentEmail && (
              <InfoRow label="Parent Email" value={a.parentDetails.parentEmail} />
            )}
          </View>
        )} */}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d13030",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "50",
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
    flex: 0.4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
    flex: 0.6,
    textAlign: "right",
  },
});

export default HodStudentDetail;