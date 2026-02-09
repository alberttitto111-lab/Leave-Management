import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
// --- FIX: Import Expo Image Picker ---
import * as ImagePicker from "expo-image-picker";
import { getAccessToken } from "../../utils/storage";
import { API_BASE_URL } from "../../utils/constants";

const HEADER_HEIGHT = 260;

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form States - Unified for both nested objects
  const [bio, setBio] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/teacher/profile");
      const data = res.data.data;

      console.log("Loaded profile data:", JSON.stringify(data, null, 2));

      setProfile(data);

      const profDetails = data.professionalDetails || {};
      const personalInfo = data.personalInfo || {};

      setBio(profDetails.bio || "");
      setQualification(profDetails.qualification || "");
      setExperience(profDetails.experience || "");
      setSpecialization(profDetails.specialization || "");

      setEmail(personalInfo.email || "");
      setPhone(personalInfo.phone || "");
      setAddress(personalInfo.address || "");
    } catch (e) {
      console.error("Load profile error:", e);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // --- FIX: Updated Photo Handler for Expo ---
  const handleCameraPress = async () => {
    // 1. Request Permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to photos to update your profile picture.",
      );
      return;
    }

    // 2. Open Library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0]);
    }
  };

  // TeacherProfile.js

  const uploadPhoto = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // 1. Format the file correctly for FormData
      const uri =
        Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;
      const filename = file.fileName || uri.split("/").pop();
      const type = file.mimeType || `image/${filename.split(".").pop()}`;

      formData.append("profilePicture", {
        uri: uri,
        type: type,
        name: filename,
      });

      console.log("Sending FormData with fetch:", formData);

      // 2. Use fetch API
      // --- FIX: Access Token from your storage utility ---
      const token = await getAccessToken(); // Import this from your storage utils

      // --- FIX: API Base URL ---
      const response = await fetch(
        `${API_BASE_URL}/teacher/profile/upload-photo`,
        {
          method: "POST",
          body: formData,
          headers: {
            // --- CRUCIAL: Do NOT set Content-Type header ---
            // Fetch will set it automatically with the boundary
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setProfile(result.data);
        Alert.alert("Success", "Photo updated successfully");
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (e) {
      console.error("Photo upload error:", e);
      Alert.alert("Error", e.message || "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const updateData = {
        "professionalDetails.bio": bio,
        "professionalDetails.qualification": qualification,
        "professionalDetails.experience": experience,
        "professionalDetails.specialization": specialization,
        "personalInfo.email": email,
        "personalInfo.phone": phone,
        "personalInfo.address": address,
      };

      const response = await api.patch("/teacher/profile", updateData);

      if (response.data.data) {
        setProfile(response.data.data);
        setEditing(false);
        Alert.alert("Success", "Profile updated successfully");
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

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.photoContainer}>
          {profile?.personalInfo?.profilePicture ? (
            // TeacherProfile.js (JSX)

            <Image
              source={{
                uri: profile?.personalInfo?.profilePicture
                  ? `${API_BASE_URL.replace("/api", "")}${profile.personalInfo.profilePicture}`
                  : "https://via.placeholder.com/150",
              }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>
                {profile?.personalInfo?.firstName?.[0] || "T"}
                {profile?.personalInfo?.lastName?.[0] || "P"}
              </Text>
            </View>
          )}
          {/* --- FIX: Attach handler here --- */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={handleCameraPress}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>
          {profile?.personalInfo?.firstName} {profile?.personalInfo?.lastName}
        </Text>

        <Text style={styles.role}>{profile?.role?.toUpperCase()}</Text>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            if (editing) {
              const currentProf = profile?.professionalDetails || {};
              const currentPersonal = profile?.personalInfo || {};
              setBio(currentProf.bio || "");
              setQualification(currentProf.qualification || "");
              setExperience(currentProf.experience || "");
              setSpecialization(currentProf.specialization || "");
              setEmail(currentPersonal.email || "");
              setPhone(currentPersonal.phone || "");
              setAddress(currentPersonal.address || "");
            }
            setEditing((p) => !p);
          }}
        >
          <Ionicons
            name={editing ? "close-outline" : "create-outline"}
            size={16}
            color="#7C3AED"
          />
          <Text style={styles.editText}>
            {editing ? "Cancel" : "Edit Profile"}
          </Text>
        </TouchableOpacity>
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
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View style={{ height: HEADER_HEIGHT + 10 }} />

          {/* Professional Details */}
          <Card>
            <SectionTitle title="Professional Details" />
            <Field
              label="Bio"
              value={bio}
              onChangeText={setBio}
              editing={editing}
              multiline
            />
            <Field
              label="Qualification"
              value={qualification}
              onChangeText={setQualification}
              editing={editing}
            />
            <Field
              label="Experience"
              value={experience}
              onChangeText={setExperience}
              editing={editing}
            />
            <Field
              label="Specialization"
              value={specialization}
              onChangeText={setSpecialization}
              editing={editing}
            />
          </Card>

          {/* Contact Information */}
          <Card>
            <SectionTitle title="Contact Information" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              editing={editing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              editing={editing}
              keyboardType="phone-pad"
            />
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
              value={profile?.teachingInfo?.subjects?.join(", ")}
            />
            <ReadOnly
              label="Classes"
              value={profile?.teachingInfo?.classSections?.join(", ")}
            />
            <ReadOnly label="Department" value={profile?.departmentId?.name} />
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
        placeholder={`Enter ${label.toLowerCase()}`}
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
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#7C3AED",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    alignItems: "center",
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
  },
  placeholderPhoto: {
    backgroundColor: "#9F7AEA",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10B981",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  role: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    letterSpacing: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 10,
  },
  editText: {
    color: "#7C3AED",
    fontWeight: "600",
    fontSize: 13,
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
    backgroundColor: "#7C3AED",
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
});

export default TeacherProfile;
