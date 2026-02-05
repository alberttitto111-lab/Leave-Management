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
      />
    </View>
  </View>
);

const AddTeacherScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // teachingInfo states
  const [classSections, setClassSections] = useState(""); // Input like: "10-A, 11-B"
  const [subjects, setSubjects] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data);
      if (res.data.length > 0) setDepartmentId(res.data[0]._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    // Basic validation based on Model's "required: true" fields
    if (!userId || !password || !firstName || !lastName || !departmentId) {
      return Alert.alert("Error", "Please fill all required fields");
    }

    setLoading(true);
    try {
      // Adjusted payload to match the Teacher Mongoose Model exactly
      await api.post("/admin/teachers", {
        userId, // Used by backend to create/link User record
        password, // Used by backend for User record
        departmentId,
        contactInfo: {
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
        },
        teachingInfo: {
          // Format strings into arrays as expected by the schema
          classSections: classSections
            .split(",")
            .map((x) => x.trim())
            .filter((x) => x),
          subjects: subjects
            .split(",")
            .map((x) => x.trim())
            .filter((x) => x),
        },
        // Passing names so backend can update the linked User profile
        firstName,
        lastName,
      });

      Alert.alert("Success", "Teacher created", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert(
        "Error",
        e.response?.data?.message || "Failed to create teacher",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add New Teacher</Text>

          <InputField
            label="User ID"
            value={userId}
            onChangeText={setUserId}
            placeholder="TEA2024001"
            icon="person-outline"
            required
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Temporary password"
            icon="lock-closed-outline"
            required
          />

          <Text style={styles.sectionHeader}>Personal Info</Text>
          <InputField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            icon="person-outline"
            required
          />
          <InputField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            icon="person-outline"
            required
          />
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="teacher@school.com"
            icon="mail-outline"
            keyboardType="email-address"
          />
          <InputField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="1234567890"
            icon="call-outline"
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionHeader}>Teaching Assignment</Text>
          <InputField
            label="Class Sections (e.g. 10-A, 11-B)"
            value={classSections}
            onChangeText={setClassSections}
            placeholder="Comma separated"
            icon="school-outline"
          />
          <InputField
            label="Subjects"
            value={subjects}
            onChangeText={setSubjects}
            placeholder="Math, Science"
            icon="book-outline"
          />

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Teacher</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  required: { color: "#EF4444" },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

export default AddTeacherScreen;
