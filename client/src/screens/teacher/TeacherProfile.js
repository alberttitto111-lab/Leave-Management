import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useUser } from "../../contexts/UserContext"; // Add this import
import { getAccessToken } from "../../utils/storage";
import { API_BASE_URL } from "../../utils/constants";

const HEADER_HEIGHT = 100;

const TeacherProfile = ({ navigation }) => {
  const { userProfile, updateUserProfile, fetchUserProfile } = useUser(); // Use the context
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form States - Personal Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  // Load profile from context
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Fetch profile through context
      const profile = await fetchUserProfile();
      
      if (profile) {
        const personalInfo = profile.personalInfo || {};
        setFirstName(personalInfo.firstName || "");
        setLastName(personalInfo.lastName || "");
        setEmail(personalInfo.email || "");
        setPhone(personalInfo.phone || "");
        setDateOfBirth(personalInfo.dateOfBirth || "");
        setGender(personalInfo.gender || "");
        setAddress(personalInfo.address || "");
      }
    } catch (e) {
      console.error("Load profile error:", e);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Prepare the update data
      const updateData = {
        personalInfo: {
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth,
          gender,
          address,
        }
      };

      console.log("Saving profile data:", updateData);

      // Use the context to update profile
      const result = await updateUserProfile(updateData);

      if (result.success) {
        setEditing(false);
        Alert.alert(
          "Success", 
          "Profile updated successfully",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to Dashboard after user clicks OK
                navigation.navigate("TeacherDashboard");
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert(
        "Error",
        e.response?.data?.message || e.message || "Update failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const cancelEdit = () => {
    // Reset form to original profile values from context
    const personalInfo = userProfile?.personalInfo || {};
    setFirstName(personalInfo.firstName || "");
    setLastName(personalInfo.lastName || "");
    setEmail(personalInfo.email || "");
    setPhone(personalInfo.phone || "");
    setDateOfBirth(personalInfo.dateOfBirth || "");
    setGender(personalInfo.gender || "");
    setAddress(personalInfo.address || "");
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#0D9488" }]}>
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
              {firstName || ""} {lastName || ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (editing) {
                cancelEdit();
              } else {
                setEditing(true);
              }
            }}
          >
            <Ionicons
              name={editing ? "close-outline" : "create-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.editButtonText}>
              {editing ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle="black"
          keyboardDismissMode="on-drag"
        >
          <View style={{ height: HEADER_HEIGHT + 10 }} />

          {/* Personal Information */}
          <Card>
            <SectionTitle title="Personal Information" />
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Field
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  editing={editing}
                />
              </View>
              <View style={styles.halfWidth}>
                <Field
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  editing={editing}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.emailFieldWidth}>
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  editing={editing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.phoneFieldWidth}>
                <Field
                  label="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  editing={editing}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              {/* <View style={styles.dateFieldWidth}>
                <Field
                  label="Date of Birth"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  editing={editing}
                  placeholder="YYYY-MM-DD"
                />
              </View> */}
              <View style={styles.genderFieldWidth}>
                <Field
                  label="Gender"
                  value={gender}
                  onChangeText={setGender}
                  editing={editing}
                  placeholder="Male/Female/Other"
                />
              </View>
            </View>

            <Field
              label="Address"
              value={address}
              onChangeText={setAddress}
              editing={editing}
              multiline
            />
          </Card>

          {/* Teaching Info - Display from profile state */}
          <Card>
            <SectionTitle title="Teaching Info" />
            <ReadOnly
              label="Subjects"
              value={userProfile?.teachingInfo?.subjects?.join(", ")}
            />
            <ReadOnly
              label="Classes"
              value={userProfile?.teachingInfo?.classSections?.join(", ")}
            />
            <ReadOnly label="Department" value={userProfile?.departmentId?.name} />
          </Card>

          {editing && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveText}>Save Changes</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

/* Small Components */
const Card = ({ children }) => <View style={styles.card}>{children}</View>;

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Field = ({
  label,
  value,
  onChangeText,
  editing,
  multiline,
  keyboardType,
  autoCapitalize,
  placeholder,
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    {editing ? (
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "sentences"}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor="#94a3b8"
        editable={true}
      />
    ) : (
      <Text style={styles.value}>{value || "-"}</Text>
    )}
  </View>
);

const ReadOnly = ({ label, value }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "-"}</Text>
  </View>
);

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dfeee752",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#33b033",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Layout rows
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
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
});

export default TeacherProfile;