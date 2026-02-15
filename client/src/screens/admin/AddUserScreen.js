import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
  secureTextEntry = false,
  required = false,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <View style={styles.inputWrapper}>
      <Ionicons
        name={icon}
        size={20}
        color="#64748B"
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
);

const SelectField = ({
  label,
  value,
  onSelect,
  options,
  icon,
  required = false,
}) => (
  <View style={styles.inputContainer}>
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
          onPress={() => onSelect(option.value)}
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

const AddUserScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Basic Info
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
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

  // Student Academic Info (only for students)
  const [rollNumber, setRollNumber] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [batchYear, setBatchYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  // ---------------- TEACHER / HOD INFO ----------------

  // Teacher
  const [teacherClasses, setTeacherClasses] = useState("");
  const [teacherSections, setTeacherSections] = useState("");
  const [subjects, setSubjects] = useState("");
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  // HOD
  const [hodOffice, setHodOffice] = useState("");

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/admin/departments");
      setDepartments(response.data);
      if (response.data.length > 0) {
        setDepartmentId(response.data[0]._id);
      }
    } catch (error) {
      console.error("Fetch departments error:", error);
    }
  };

  const validateStep1 = () => {
    if (!userId.trim()) {
      Alert.alert("Error", "User ID is required");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Password is required");
      return false;
    }
    if (!departmentId && role !== "admin") {
      Alert.alert("Error", "Department is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);

    try {
      const payload = {
        userId,
        password,
        role,
        departmentId: role !== "admin" ? departmentId : null,
        personalInfo: {
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          address,
        },
      };

      // ✅ Add academic info for students
      if (role === "student") {
        payload.academicInfo = {
          rollNumber,
          class: className,
          section,
          batchYear: parseInt(batchYear),
          parentDetails: {
            fatherName,
            motherName,
            parentPhone,
            parentEmail,
          },
        };
      }

      // ✅ Add teaching info for teachers
      if (role === "teacher") {
        payload.teachingInfo = {
          classSections: teacherClasses
            ? teacherClasses.split(",").map((s) => s.trim())
            : [],
          subjects: subjects ? subjects.split(",").map((s) => s.trim()) : [],
          isClassTeacher: isClassTeacher,
        };
      }

      // ✅ Add HOD info for HODs
      if (role === "hod") {
        payload.hodInfo = {
          officeRoom: hodOffice || "",
          // Note: managedDepartments should be set by admin separately or default to current dept
          managedDepartments: departmentId ? [departmentId] : [],
        };
      }

      console.log("Sending payload:", payload); // Debug log

      const response = await api.post("/admin/users", payload);

      Alert.alert(
        "Success",
        `User ${response.data.user.userId} created successfully!`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error("Create user error:", error.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView 
      style={styles.stepScrollView} 
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.stepContentContainer}
    >
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Basic Information</Text>

        <InputField
          label="User ID"
          value={userId}
          onChangeText={setUserId}
          placeholder="e.g., STU2024001"
          icon="person-outline"
          required
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Temporary password"
          icon="lock-closed-outline"
          secureTextEntry
          required
        />

        <SelectField
          label="Role"
          value={role}
          onSelect={setRole}
          options={[
            { label: "Student", value: "student" },
            { label: "Teacher", value: "teacher" },
            { label: "HOD", value: "hod" },
            { label: "Staff", value: "staff" },
            { label: "Admin", value: "admin" },
          ]}
          required
        />

        {role !== "admin" && (
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
                  onPress={() => setDepartmentId(dept._id)}
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
        )}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView 
      style={styles.stepScrollView} 
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.stepContentContainer}
    >
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Personal Information</Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <InputField
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              icon="person-outline"
              required
            />
          </View>
          <View style={styles.halfWidth}>
            <InputField
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              icon="person-outline"
              required
            />
          </View>
        </View>

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="john@example.com"
          icon="mail-outline"
          keyboardType="email-address"
        />

        <InputField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1234567890"
          icon="call-outline"
          keyboardType="phone-pad"
        />

        <SelectField
          label="Gender"
          value={gender}
          onSelect={setGender}
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ]}
        />

        <InputField
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Full address"
          icon="location-outline"
        />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => {
    // ---------------- TEACHER ----------------
    if (role === "teacher") {
      return (
        <ScrollView 
          style={styles.stepScrollView} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.stepContentContainer}
        >
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Teaching Information</Text>

            <InputField
              label="Classes"
              value={teacherClasses}
              onChangeText={setTeacherClasses}
              placeholder="e.g., 10,11,12"
              icon="school-outline"
            />

            <InputField
              label="Sections"
              value={teacherSections}
              onChangeText={setTeacherSections}
              placeholder="e.g., A,B,C"
              icon="git-branch-outline"
            />

            <InputField
              label="Subjects"
              value={subjects}
              onChangeText={setSubjects}
              placeholder="e.g., Maths, Physics"
              icon="book-outline"
            />

            <SelectField
              label="Class Teacher?"
              value={isClassTeacher ? "yes" : "no"}
              onSelect={(v) => setIsClassTeacher(v === "yes")}
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
            />
          </View>
        </ScrollView>
      );
    }

    // ---------------- HOD ----------------
    if (role === "hod") {
      return (
        <ScrollView 
          style={styles.stepScrollView} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.stepContentContainer}
        >
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>HOD Information</Text>

            <InputField
              label="Office / Cabin"
              value={hodOffice}
              onChangeText={setHodOffice}
              placeholder="e.g., Block B Room 204"
              icon="business-outline"
            />

            <InputField
              label="Subjects Handled"
              value={subjects}
              onChangeText={setSubjects}
              placeholder="e.g., Robotics, AI"
              icon="book-outline"
            />
          </View>
        </ScrollView>
      );
    }

    // ---------------- NON-STUDENT REVIEW (unchanged behavior) ----------------
    if (role !== "student") {
      return (
        <ScrollView 
          style={styles.stepScrollView} 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.stepContentContainer}
        >
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <View style={styles.reviewCard}>
              <ReviewItem label="User ID" value={userId} />
              <ReviewItem label="Role" value={role} />
              <ReviewItem label="Name" value={`${firstName} ${lastName}`} />
              <ReviewItem label="Email" value={email} />
              <ReviewItem label="Phone" value={phone} />
            </View>
          </View>
        </ScrollView>
      );
    }

    // ---------------- STUDENT (UNCHANGED — exactly yours) ----------------
    return (
      <ScrollView 
        style={styles.stepScrollView} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.stepContentContainer}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Academic Information (Student)</Text>

          <InputField
            label="Roll Number"
            value={rollNumber}
            onChangeText={setRollNumber}
            placeholder="e.g., 101"
            icon="id-card-outline"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Class"
                value={className}
                onChangeText={setClassName}
                placeholder="e.g., 10"
                icon="school-outline"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Section"
                value={section}
                onChangeText={setSection}
                placeholder="e.g., A"
                icon="git-branch-outline"
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
          />

          <Text style={styles.sectionHeader}>Parent Details</Text>

          <InputField
            label="Father's Name"
            value={fatherName}
            onChangeText={setFatherName}
            placeholder="Father's full name"
            icon="man-outline"
          />

          <InputField
            label="Mother's Name"
            value={motherName}
            onChangeText={setMotherName}
            placeholder="Mother's full name"
            icon="woman-outline"
          />

          <InputField
            label="Parent Phone"
            value={parentPhone}
            onChangeText={setParentPhone}
            placeholder="Parent's contact number"
            icon="call-outline"
            keyboardType="phone-pad"
          />
        </View>
      </ScrollView>
    );
  };

  const ReviewItem = ({ label, value }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || "N/A"}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
              {step < 3 && (
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

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {/* {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.fullWidth]}
            onPress={() => {
              if (currentStep === 1 && validateStep1()) setCurrentStep(2);
              else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Create User</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )} */}

        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.fullWidth]}
            onPress={() => {
              if (currentStep === 1 && validateStep1()) setCurrentStep(2);
              else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, styles.submitButton]}
            onPress={async () => {
              if (!submitted) {
                // First click: submit form
                await handleSubmit();
                setSubmitted(true); // Mark as submitted
              } else {
                // Second click: reload the page
                window.location.reload();
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {submitted ? "Reload Page" : "Create User"}
                </Text>
                <Ionicons
                  name={submitted ? "reload-outline" : "checkmark"}
                  size={20}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  stepScrollView: {
    maxHeight: 400, // Fixed height for step content to enable scrolling
  },
  stepContentContainer: {
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
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
    backgroundColor: "#7C3AED",
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
    backgroundColor: "#7C3AED",
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 20,
  },
  inputContainer: {
    position: "relative",
    bottom: 0,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
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
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionButtonSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  optionText: {
    fontSize: 14,
    color: "#475569",
  },
  optionTextSelected: {
    color: "#fff",
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
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  deptButtonSelected: {
    backgroundColor: "#EDE9FE",
    borderColor: "#7C3AED",
  },
  deptText: {
    fontSize: 14,
    color: "#475569",
  },
  deptTextSelected: {
    color: "#7C3AED",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  reviewLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  bottomPadding: {
    height: 100,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  nextButton: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
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

export default AddUserScreen;