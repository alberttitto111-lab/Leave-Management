import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import api from "../../services/authService";

const BulkUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        // Check file size (5MB limit)
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        if (fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert("Error", "File size exceeds 5MB limit");
          return;
        }

        setFile(result);
        setResult(null);
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadFile = async () => {
    if (!file) {
      Alert.alert("Error", "Please select a file first");
      return;
    }

    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();

      const fileUri =
        Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");

      formData.append("file", {
        uri: fileUri,
        type: file.mimeType || "text/csv",
        name: file.name,
      });

      const response = await api.post("/api/admin/users/bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 second timeout for large files
      });

      setResult(response.data);

      if (response.data.errorCount === 0) {
        Alert.alert(
          "Success",
          `Successfully created ${response.data.successCount} users`,
        );
      } else {
        Alert.alert(
          "Partial Success",
          `Created: ${response.data.successCount}\nFailed: ${response.data.errorCount}`,
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        error.response?.data?.message || "Failed to upload file",
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // In a real app, you would generate and download a CSV template
    const template = `userId,password,role,firstName,lastName,email,phone,departmentId,rollNumber,class,section,batchYear,fatherName,motherName,parentPhone
STU2024001,TempPass123!,student,John,Doe,john@example.com,1234567890,DEPT_ID,101,10,A,2024,Mr. Doe,Mrs. Doe,9876543210
TCH2024001,TempPass123!,teacher,Jane,Smith,jane@example.com,1234567891,DEPT_ID,,,,,,,
HOD2024001,TempPass123!,hod,Robert,Johnson,robert@example.com,1234567892,DEPT_ID,,,,,,,`;

    Alert.alert(
      "Template Format",
      "Your CSV should include these columns:\n\n" +
        "Required: userId, password, role, firstName, lastName\n" +
        "Optional: email, phone, departmentId\n" +
        "Student only: rollNumber, class, section, batchYear, fatherName, motherName, parentPhone\n\n" +
        "Roles: student, teacher, hod, staff, admin",
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bulk User Upload</Text>
        <Text style={styles.subtitle}>
          Upload CSV or Excel file to create multiple users
        </Text>
      </View>

      {/* Template Download */}
      <TouchableOpacity style={styles.templateCard} onPress={downloadTemplate}>
        <View style={styles.templateIcon}>
          <Ionicons name="download-outline" size={28} color="#7C3AED" />
        </View>
        <View style={styles.templateContent}>
          <Text style={styles.templateTitle}>Download Template</Text>
          <Text style={styles.templateDesc}>
            Get the CSV format with all required columns
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>

      {/* File Upload Area */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload File</Text>

        <TouchableOpacity
          style={[styles.uploadBox, file && styles.uploadBoxActive]}
          onPress={pickDocument}
          disabled={uploading}
        >
          {file ? (
            <View style={styles.fileSelected}>
              <Ionicons name="document-text" size={48} color="#7C3AED" />
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileSize}>
                {(file.size / 1024).toFixed(2)} KB
              </Text>
              <TouchableOpacity
                style={styles.changeFileButton}
                onPress={pickDocument}
              >
                <Text style={styles.changeFileText}>Change File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={48}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.uploadText}>
                Tap to select CSV or Excel file
              </Text>
              <Text style={styles.uploadSubtext}>Max file size: 5MB</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Upload Button */}
        {file && (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              uploading && styles.uploadButtonDisabled,
            ]}
            onPress={uploadFile}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload & Process</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Upload Results</Text>

          <View style={styles.resultStats}>
            <View style={[styles.statBox, styles.successBox]}>
              <Text style={styles.statNumber}>{result.successCount}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View
              style={[
                styles.statBox,
                result.errorCount > 0 ? styles.errorBox : styles.successBox,
              ]}
            >
              <Text style={styles.statNumber}>{result.errorCount}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>

          {result.errors && result.errors.length > 0 && (
            <View style={styles.errorsSection}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {result.errors.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>
                    Row {error.row}: {error.error}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.instructionText}>
            File must be in CSV or Excel format
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.instructionText}>
            First row should be headers (don't skip)
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.instructionText}>User IDs must be unique</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.instructionText}>
            Passwords will be hashed automatically
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.instructionText}>
            For students, include academic details
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
  },
  templateDesc: {
    fontSize: 13,
    color: "#8B5CF6",
    marginTop: 2,
  },
  uploadSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  uploadBox: {
    height: 200,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  uploadBoxActive: {
    borderColor: "#7C3AED",
    borderStyle: "solid",
    backgroundColor: "#FAF5FF",
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  uploadSubtext: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  fileSelected: {
    alignItems: "center",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 12,
    textAlign: "center",
  },
  fileSize: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  changeFileButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  changeFileText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    height: 50,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  resultStats: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  successBox: {
    backgroundColor: "#D1FAE5",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  errorsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 8,
  },
  errorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#475569",
  },
});

export default BulkUploadScreen;
