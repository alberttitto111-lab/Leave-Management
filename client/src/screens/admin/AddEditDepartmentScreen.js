import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";
import { useToast } from "../../contexts/ToastContext"; // Add this import

const AddEditDepartmentScreen = ({ route, navigation }) => {
  const department = route?.params?.department;
  const onGoBack = route?.params?.onGoBack;
  
  const [name, setName] = useState(department?.name || "");
  const [code, setCode] = useState(department?.code || "");
  const [description, setDescription] = useState(department?.description || "");
  const [loading, setLoading] = useState(false);
  
  // Initialize the toast hook
  const { showToast } = useToast();

  const isEdit = !!department;

  const handleSubmit = async () => {
    if (!name || !code) {
      showToast("Name and code are required", "error"); // Show error toast
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await api.put(`/admin/departments/${department._id}`, {
          name,
          code,
          description,
        });
        showToast(`Department "${name}" updated successfully!`, "success"); // Show success toast
      } else {
        await api.post("/admin/departments", {
          name,
          code,
          description,
        });
        showToast(`Department "${name}" created successfully!`, "success"); // Show success toast
      }

      // Wait for toast to show, then navigate back
      setTimeout(() => {
        // Call the callback to refresh the list
        if (onGoBack) {
          onGoBack();
        }
        navigation.goBack();
      }, 1500);
      
    } catch (err) {
      console.error("Department operation error:", err);
      showToast(
        err.response?.data?.message || "Something went wrong",
        "error" // Show error toast
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Department Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Computer Science"
            placeholderTextColor={COLORS.slateLight}
            editable={!loading}
          />

          <Text style={styles.label}>Department Code *</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="e.g. CSE"
            autoCapitalize="characters"
            placeholderTextColor={COLORS.slateLight}
            editable={!loading}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Enter department description..."
            placeholderTextColor={COLORS.slateLight}
            editable={!loading}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : (isEdit ? "Update Department" : "Add Department")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // elevation: 2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20, 
    shadowColor: "#7300ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.slateDark,
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    fontSize: 14,
    color: COLORS.slateDark,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#16bc2c",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16 
  },
});

export default AddEditDepartmentScreen;