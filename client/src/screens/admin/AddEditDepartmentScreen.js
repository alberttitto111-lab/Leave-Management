import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const AddEditDepartmentScreen = ({ route, navigation }) => {
  const department = route?.params?.department;

  const [name, setName] = useState(department?.name || "");
  const [code, setCode] = useState(department?.code || "");
  const [description, setDescription] = useState(department?.description || "");
  const [loading, setLoading] = useState(false);

  const isEdit = !!department;

  const handleSubmit = async () => {
    if (!name || !code) {
      Alert.alert("Validation", "Name and code are required");
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
      } else {
        await api.post("/admin/departments", {
          name,
          code,
          description,
        });
      }

      Alert.alert(
        "Success",
        `Department ${isEdit ? "updated" : "created"} successfully`,
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Department Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Computer Science"
      />

      <Text style={styles.label}>Department Code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="e.g. CSE"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {isEdit ? "Update Department" : "Add Department"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: COLORS.slateDark,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  button: {
    backgroundColor: COLORS.info,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default AddEditDepartmentScreen;
