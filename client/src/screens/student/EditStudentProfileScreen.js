import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

const EditStudentProfileScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUpdated, setIsUpdated] = useState(false);

  // Basic Info
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("student");
  const [departmentId, setDepartmentId] = useState("");

  // Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  
  // Academic Info
  const [rollNumber, setRollNumber] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [batchYear, setBatchYear] = useState("");

  // Account Info
  const [isActive, setIsActive] = useState(true);
  const [lastLogin, setLastLogin] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    loadProfile();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/admin/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Fetch departments error:", error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/student/profile");
      const data = response.data.data || response.data;
      
      setProfile(data);
      console.log("Profile data:", JSON.stringify(data, null, 2));
      
      // Basic Info
      setUserId(data.userId || "");
      setRole(data.role || "student");
      setDepartmentId(data.departmentId?._id || data.departmentId || "");
      
      // Personal Info
      setFirstName(data.personalInfo?.firstName || "");
      setLastName(data.personalInfo?.lastName || "");
      setEmail(data.personalInfo?.email || "");
      setPhone(data.personalInfo?.phone || "");
      setDateOfBirth(data.personalInfo?.dateOfBirth ? new Date(data.personalInfo.dateOfBirth).toLocaleDateString() : "");
      setGender(data.personalInfo?.gender || "");
      setAddress(data.personalInfo?.address || "");
      
      // Academic Info
      if (data.academicInfo) {
        setRollNumber(data.academicInfo.rollNumber || "");
        setClassName(data.academicInfo.class || "");
        setSection(data.academicInfo.section || "");
        setBatchYear(data.academicInfo.batchYear?.toString() || "");
      }

      // Account Info
      setIsActive(data.isActive !== undefined ? data.isActive : true);
      setLastLogin(data.lastLogin ? new Date(data.lastLogin).toLocaleString() : "Never");
      setCreatedAt(data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "");
      
    } catch (error) {
      console.error("Load profile error:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
  setSaving(true);
  try {
    const payload = {
      userId,
      personalInfo: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
      },
      academicInfo: {
        rollNumber,
        class: className,
        section,
        batchYear: parseInt(batchYear) || new Date().getFullYear(),
      },
      departmentId: departmentId || null,
    };

    console.log("Saving payload:", payload);

    const response = await api.patch(`/student/profile`, payload);
    
    if (response.data?.success) {
      setIsUpdated(true);
      
      // Refresh the user profile in AuthContext
      await refreshUserProfile();
      
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  } catch (error) {
    console.error("Save error:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || "Failed to update profile"
    );
  } finally {
    setSaving(false);
  }
};

  const InputField = ({ label, value, onChangeText, placeholder, icon, multiline, keyboardType, required, containerStyle }) => (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setIsUpdated(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.slateLight}
          multiline={multiline}
          keyboardType={keyboardType}
          editable={!saving}
        />
      </View>
    </View>
  );

  const SelectField = ({ label, value, onSelect, options, icon, required, containerStyle }) => (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => {
              onSelect(option.value);
              setIsUpdated(false);
            }}
          >
            <Text
              style={[
                styles.optionText,
                value === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const DepartmentSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Department</Text>
      <View style={styles.departmentsContainer}>
        {departments.map((dept) => (
          <TouchableOpacity
            key={dept._id}
            style={[
              styles.deptButton,
              departmentId === dept._id && styles.deptButtonSelected,
            ]}
            onPress={() => {
              setDepartmentId(dept._id);
              setIsUpdated(false);
            }}
          >
            <Text
              style={[
                styles.deptText,
                departmentId === dept._id && styles.deptTextSelected,
              ]}
            >
              {dept.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "N/A"}</Text>
    </View>
  );

  // Step 1: Account Information
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account Information</Text>
      <InfoRow label="User ID" value={userId} />
      <InfoRow label="Role" value={role} />
      <InfoRow label="Status" value={isActive ? "Active" : "Inactive"} />
      <InfoRow label="Last Login" value={lastLogin} />
      <InfoRow label="Member Since" value={createdAt} />
    </View>
  );

  // Step 2: Department
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Department</Text>
      <DepartmentSelector />
    </View>
  );

  // Step 3: Personal Information
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <InputField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            icon="person-outline"
            required
          />
        </View>
        <View style={styles.halfWidth}>
          <InputField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            icon="person-outline"
            required
          />
        </View>
      </View>
      
      {/* Email and Phone side by side */}
      <View style={styles.row}>
        <View style={styles.emailFieldWidth}>
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            icon="mail-outline"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.phoneFieldWidth}>
          <InputField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            icon="call-outline"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      
      {/* Date of Birth and Gender side by side */}
      <View style={styles.row}>
        <View style={styles.dateFieldWidth}>
          <InputField
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="MM/DD/YYYY"
            icon="calendar-outline"
          />
        </View>
        <View style={styles.genderFieldWidth}>
          <SelectField
            label="Gender"
            value={gender}
            onSelect={setGender}
            options={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
            ]}
            icon="people-outline"
          />
        </View>
      </View>
      
      <InputField
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Enter address"
        icon="location-outline"
        multiline
      />
    </View>
  );

  // Step 4: Academic Information
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Academic Information</Text>
      
      <InputField
        label="Roll Number"
        value={rollNumber}
        onChangeText={setRollNumber}
        placeholder="Enter roll number"
        icon="id-card-outline"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <InputField
            label="Class"
            value={className}
            onChangeText={setClassName}
            placeholder="e.g., 10"
            icon="school-outline"
            required
          />
        </View>
        <View style={styles.halfWidth}>
          <InputField
            label="Section"
            value={section}
            onChangeText={setSection}
            placeholder="e.g., A"
            icon="git-branch-outline"
            required
          />
        </View>
      </View>
      
      <InputField
        label="Batch Year"
        value={batchYear}
        onChangeText={setBatchYear}
        placeholder="2024"
        icon="calendar-outline"
        keyboardType="number-pad"
        required
      />
    </View>
  );

  const validateStep1 = () => true;
  const validateStep2 = () => true;
  const validateStep3 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation Error", "First name and last name are required");
      return false;
    }
    return true;
  };
  const validateStep4 = () => {
    if (!rollNumber.trim() || !className.trim() || !section.trim() || !batchYear.trim()) {
      Alert.alert("Validation Error", "All academic fields are required");
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStep}>
            <TouchableOpacity
              style={[
                styles.stepCircle,
                currentStep >= step && styles.stepCircleActive,
              ]}
              onPress={() => setCurrentStep(step)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= step && styles.stepNumberActive,
                ]}
              >
                {step}
              </Text>
            </TouchableOpacity>
            {step < 4 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Labels */}
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>Account</Text>
        <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>Dept</Text>
        <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>Personal</Text>
        <Text style={[styles.stepLabel, currentStep === 4 && styles.stepLabelActive]}>Academic</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle="black"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          {/* Buttons directly below the form */}
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButtonStep}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
              <TouchableOpacity
                style={[styles.nextButton, currentStep === 1 && styles.fullWidth]}
                onPress={() => {
                  let isValid = true;
                  if (currentStep === 3) isValid = validateStep3();
                  
                  if (isValid) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, styles.submitButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Save Profile</Text>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  stepLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 30,
    paddingTop: 15,
    paddingBottom: 0,
  },
  stepContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.slateDark,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  emailFieldWidth: {
    flex: 0.5,
  },
  phoneFieldWidth: {
    flex: 0.5,
  },
  dateFieldWidth: {
    flex: 0.4,
  },
  genderFieldWidth: {
    flex: 0.6,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.slate,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: "500",
  },
  departmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  deptButtonSelected: {
    backgroundColor: COLORS.primary + "10",
    borderColor: COLORS.primary,
  },
  deptText: {
    fontSize: 14,
    color: COLORS.slate,
  },
  deptTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
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
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 0,
    marginTop: 0,
    marginBottom: 20,
    backgroundColor: "transparent",
    gap: 12,
  },
  backButtonStep: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#b2b4b5",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1c1e",
  },
  nextButton: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  fullWidth: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#10B981",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditStudentProfileScreen;