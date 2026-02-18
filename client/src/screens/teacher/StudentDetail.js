// screens/teacher/StudentDetail.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 100; // Decreased from 200 to 100

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const StudentDetail = ({ route, navigation }) => {
  const { studentId } = route.params;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudent = async () => {
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setStudent(res.data.data);
    } catch (err) {
      console.error("Failed to load student:", err);
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
  const department = student.departmentId || {};

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
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />

      {/* Fixed Header with Back Button - Reduced Height */}
      <View style={[styles.header, { backgroundColor: "#0D9488" }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Spacer for fixed header - Adjusted to match new height */}
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

        {/* Department */}
        <View style={styles.formCard}>
          <SectionHeader title="Department" />
          <InfoRow label="Department Name" value={department.name || "Not Assigned"} />
          {department.code && (
            <InfoRow label="Department Code" value={department.code} />
          )}
        </View>

        {/* Personal Information - Converted to read-only format */}
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

        {/* Bottom padding for comfortable scrolling */}
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
  // Header styles - Reduced Height
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
  // Scroll content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Form Card
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
    color: "#0D9488",
    marginBottom: 15,
  },
  // Info Row styling - Used for ALL sections
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

export default StudentDetail;