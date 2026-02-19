import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import Input from "../../components/common/Input";
import { COLORS } from "../../utils/constants";

const EditUserScreen = ({ navigation, route }) => {
  const { userId: initialUserId } = route.params;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [departments, setDepartments] = useState([]);

  // Track if the update was successful for the second click logic
  const [isUpdated, setIsUpdated] = useState(false);

  // --- FORM STATES ---
  const [newUserId, setNewUserId] = useState("");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  // Student Academic Info
  const [rollNumber, setRollNumber] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      const [deptRes, userRes] = await Promise.all([
        api.get("/admin/departments"),
        api.get(`/admin/users/${initialUserId}`),
      ]);

      setDepartments(deptRes.data);
      const user = userRes.data.user;

      setNewUserId(user.userId || "");
      setRole(user.role);
      setDepartmentId(user.departmentId?._id || "");
      setFirstName(user.personalInfo?.firstName || "");
      setLastName(user.personalInfo?.lastName || "");
      setEmail(user.personalInfo?.email || "");
      setPhone(user.personalInfo?.phone || "");
      setGender(user.personalInfo?.gender || "");
      setAddress(user.personalInfo?.address || "");

      if (user.role === "student" && user.academicInfo) {
        setRollNumber(user.academicInfo.rollNumber || "");
        setClassName(user.academicInfo.class || "");
        setSection(user.academicInfo.section || "");
        setBatchYear(user.academicInfo.batchYear?.toString() || "");
        const parents = user.academicInfo.parentDetails;
        setFatherName(parents?.fatherName || "");
        setMotherName(parents?.motherName || "");
        setParentPhone(parents?.parentPhone || "");
        setParentEmail(parents?.parentEmail || "");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (isUpdated) {
      navigation.navigate("AdminMain", {
        screen: "Users",
        params: { refresh: true },
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: newUserId, // Send the potentially updated userId
        role,
        departmentId: role !== "admin" ? departmentId : null,
        personalInfo: { firstName, lastName, email, phone, gender, address },
      };

      if (role === "student") {
        payload.academicInfo = {
          rollNumber,
          class: className,
          section,
          batchYear: parseInt(batchYear),
          parentDetails: { fatherName, motherName, parentPhone, parentEmail },
        };
      }

      // ✅ Add support for teacher/HOD updates if needed
      // You'll need to add state variables for these in your component
      if (role === "teacher") {
        payload.teachingInfo = {
          classSections: [], // Add state for this if you want to edit it
          subjects: [],
          isClassTeacher: false,
        };
      }

      if (role === "hod") {
        payload.hodInfo = {
          officeRoom: "", // Add state for this if you want to edit it
          managedDepartments: departmentId ? [departmentId] : [],
        };
      }

      console.log("Updating user with ID:", initialUserId); // Debug log
      console.log("Payload:", payload); // Debug log

      await api.patch(`/admin/users/${initialUserId}`, payload);

      setIsUpdated(true);

      if (Platform.OS !== "web") {
        Alert.alert("Success", "User profile updated. Click again to return.");
      }
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Update failed",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.admin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.admin} />

      <View style={[styles.fixedHeader, { backgroundColor: COLORS.admin }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>
              {firstName} {lastName}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ghostSpacer} />

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <Input
              label="User / Student ID"
              value={newUserId}
              onChangeText={(val) => {
                setNewUserId(val);
                setIsUpdated(false);
              }}
              icon="finger-print-outline"
            />

            <Text style={styles.label}>System Role</Text>
            <View style={styles.roleGrid}>
              {["student", "teacher", "hod", "staff", "admin"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => {
                    setRole(r);
                    setIsUpdated(false);
                  }}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === r && styles.roleBtnTextActive,
                    ]}
                  >
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {role !== "admin" && (
              <>
                <Text style={[styles.label, { marginTop: 15 }]}>
                  Department
                </Text>
                <View style={styles.deptGrid}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept._id}
                      style={[
                        styles.deptBtn,
                        departmentId === dept._id && styles.deptBtnActive,
                      ]}
                      onPress={() => {
                        setDepartmentId(dept._id);
                        setIsUpdated(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.deptBtnText,
                          departmentId === dept._id && styles.deptBtnTextActive,
                        ]}
                      >
                        {dept.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={(val) => {
                setFirstName(val);
                setIsUpdated(false);
              }}
              icon="person-outline"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={(val) => {
                setLastName(val);
                setIsUpdated(false);
              }}
              icon="person-outline"
            />
            <Input
              label="Email Address"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setIsUpdated(false);
              }}
              icon="mail-outline"
              keyboardType="email-address"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                setIsUpdated(false);
              }}
              icon="call-outline"
              keyboardType="phone-pad"
            />
            <Input
              label="Home Address"
              value={address}
              onChangeText={(val) => {
                setAddress(val);
                setIsUpdated(false);
              }}
              icon="location-outline"
              multiline
            />

            {role === "student" && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Academic Details</Text>
                <Input
                  label="Roll Number"
                  value={rollNumber}
                  onChangeText={(val) => {
                    setRollNumber(val);
                    setIsUpdated(false);
                  }}
                  icon="id-card-outline"
                />
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Input
                      label="Class"
                      value={className}
                      onChangeText={(val) => {
                        setClassName(val);
                        setIsUpdated(false);
                      }}
                      icon="school-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Section"
                      value={section}
                      onChangeText={(val) => {
                        setSection(val);
                        setIsUpdated(false);
                      }}
                      icon="git-branch-outline"
                    />
                  </View>
                </View>
                <Input
                  label="Batch Year"
                  value={batchYear}
                  onChangeText={(val) => {
                    setBatchYear(val);
                    setIsUpdated(false);
                  }}
                  icon="calendar-outline"
                  keyboardType="number-pad"
                />

                {/* <Text style={styles.sectionHeader}>Parent Details</Text>
                <Input
                  label="Father's Name"
                  value={fatherName}
                  onChangeText={(val) => {
                    setFatherName(val);
                    setIsUpdated(false);
                  }}
                  icon="people-outline"
                />
                <Input
                  label="Mother's Name"
                  value={motherName}
                  onChangeText={(val) => {
                    setMotherName(val);
                    setIsUpdated(false);
                  }}
                  icon="people-outline"
                />
                <Input
                  label="Parent Phone"
                  value={parentPhone}
                  onChangeText={(val) => {
                    setParentPhone(val);
                    setIsUpdated(false);
                  }}
                  icon="call-outline"
                  keyboardType="phone-pad"
                />
                <Input
                  label="Parent Email"
                  value={parentEmail}
                  onChangeText={(val) => {
                    setParentEmail(val);
                    setIsUpdated(false);
                  }} */}
                  {/* icon="mail-outline"
                /> */}
              </>
            )}
          </View>
          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: isUpdated ? "#10B981" : COLORS.admin }, // Green if successful
          ]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.saveBtnText}>
                {isUpdated ? "Success! Click to Go Back" : "Save All Changes"}
              </Text>
              <Ionicons
                name={
                  isUpdated
                    ? "arrow-back-circle-outline"
                    : "cloud-upload-outline"
                }
                size={22}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8 },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20 },
  ghostSpacer: { height: 150 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.admin,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 25 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roleBtnActive: { backgroundColor: COLORS.admin, borderColor: COLORS.admin },
  roleBtnText: { fontSize: 12, color: COLORS.slate },
  roleBtnTextActive: { color: "#fff", fontWeight: "bold" },
  deptGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deptBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  deptBtnActive: {
    backgroundColor: "#EDE9FE",
    borderWidth: 1,
    borderColor: COLORS.admin,
  },
  deptBtnText: { fontSize: 12, color: COLORS.slate },
  deptBtnTextActive: { color: COLORS.admin, fontWeight: "600" },
  row: { flexDirection: "row" },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.slateDark,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  saveBtn: {
    height: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    gap: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default EditUserScreen;
