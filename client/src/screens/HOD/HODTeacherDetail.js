// screens/HOD/HODTeacherDetail.js
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

const HODTeacherDetail = ({ route, navigation }) => {
  const { teacherId } = route.params;
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeacher = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hod/teachers/${teacherId}`);
      console.log("HOD Teacher data:", JSON.stringify(res.data.data, null, 2));
      setTeacher(res.data.data);
    } catch (err) {
      console.error("Failed to load teacher:", err);
      Alert.alert("Error", "Failed to load teacher details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeacher();
  }, [teacherId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeacher();
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d72c2c" />
        <Text style={{ marginTop: 10 }}>Loading teacher details...</Text>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#CBD5E1" />
        <Text style={{ marginTop: 10 }}>Teacher not found</Text>
      </View>
    );
  }

  const p = teacher.personalInfo || {};
  const teaching = teacher.teachingInfo || {};
  const professional = teacher.professionalDetails || {};
  const department = teacher.departmentId || {};
  
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
      <StatusBar barStyle="light-content" backgroundColor="#d72c2c" />

      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#d72c2c" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Teacher Profile</Text>
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
            colors={["#d72c2c"]}
            tintColor="#d72c2c"
          />
        }
      >
        {/* Spacer for fixed header */}
        <View style={{ height: HEADER_HEIGHT + 10 }} />

        {/* Account Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Account Information" />
          <InfoRow label="User ID" value={teacher.userId} />
          <InfoRow label="Role" value={teacher.role} />
          <InfoRow label="Status" value={teacher.isActive ? "Active" : "Inactive"} />
          <InfoRow 
            label="Last Login" 
            value={teacher.lastLogin ? new Date(teacher.lastLogin).toLocaleString() : "Never"} 
          />
          <InfoRow 
            label="Member Since" 
            value={teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "N/A"} 
          />
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

        {/* Professional Information */}
        {/* <View style={styles.formCard}>
          <SectionHeader title="Professional Information" />
          {professional.bio && (
            <InfoRow label="Bio" value={professional.bio} />
          )}
          {professional.qualification && (
            <InfoRow label="Qualification" value={professional.qualification} />
          )}
          {professional.experience && (
            <InfoRow label="Experience" value={professional.experience} />
          )}
          {professional.specialization && (
            <InfoRow label="Specialization" value={professional.specialization} />
          )}
        </View> */}

        {/* Teaching Information */}
        <View style={styles.formCard}>
          <SectionHeader title="Teaching Information" />
          {teaching.subjects && teaching.subjects.length > 0 ? (
            <InfoRow label="Subjects" value={teaching.subjects.join(", ")} />
          ) : (
            <InfoRow label="Subjects" value="No subjects assigned" />
          )}
          
          {teaching.classSections && teaching.classSections.length > 0 ? (
            <InfoRow label="Classes" value={teaching.classSections.join(", ")} />
          ) : (
            <InfoRow label="Classes" value="No classes assigned" />
          )}
          
          <InfoRow 
            label="Class Teacher" 
            value={teaching.isClassTeacher ? "Yes" : "No"} 
          />
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ede4e4",
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
    shadowColor: "#ff0000",
    shadowOffset: { width: 0, height: 5 },
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
    borderWidth: 1,
    borderColor: "#E2E8F0",
     borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  shadowColor: "#ff0000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d72c2c",
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

export default HODTeacherDetail;