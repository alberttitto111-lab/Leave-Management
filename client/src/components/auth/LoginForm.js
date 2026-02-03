import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Input from "../common/Input";
import Button from "../common/Button";
import { COLORS, MESSAGES, REGEX } from "../../utils/constants";

const LoginForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = MESSAGES.REQUIRED_FIELD;
    } else if (!REGEX.USER_ID.test(formData.userId)) {
      newErrors.userId =
        "User ID must be 4-20 characters (letters, numbers, underscore, hyphen)";
    }

    if (!formData.password) {
      newErrors.password = MESSAGES.REQUIRED_FIELD;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData.userId, formData.password);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Input
            label="User ID"
            placeholder="Enter your user ID"
            value={formData.userId}
            onChangeText={(text) => updateField("userId", text)}
            error={errors.userId}
            icon="account-outline"
            autoCapitalize="none"
            editable={!loading}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(text) => updateField("password", text)}
            error={errors.password}
            secureTextEntry={!isPasswordVisible}
            icon={isPasswordVisible ? "eye-off" : "eye"}
            onIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
            editable={!loading}
          />

          <Button
            title="Sign In"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
            icon="login"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    width: "100%",
  },
  submitButton: {
    marginTop: 8,
  },
});

export default LoginForm;
