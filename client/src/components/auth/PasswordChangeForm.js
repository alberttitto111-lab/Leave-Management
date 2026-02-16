import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from "react-native";
import Input from "../common/Input";
import Button from "../common/Button";
import { COLORS, MESSAGES, REGEX } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PasswordChangeForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return COLORS.danger;
    if (passwordStrength <= 3) return COLORS.warning;
    return COLORS.success;
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = MESSAGES.REQUIRED_FIELD;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = MESSAGES.REQUIRED_FIELD;
    } else if (!REGEX.PASSWORD.test(formData.newPassword)) {
      newErrors.newPassword = MESSAGES.WEAK_PASSWORD;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = MESSAGES.PASSWORD_MISMATCH;
    }

    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData.currentPassword, formData.newPassword);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    if (field === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const requirements = [
    { label: "At least 8 characters", met: formData.newPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(formData.newPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(formData.newPassword) },
    { label: "One number", met: /[0-9]/.test(formData.newPassword) },
    {
      label: "One special character",
      met: /[^A-Za-z0-9]/.test(formData.newPassword),
    },
  ];

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
          {/* <View style={styles.infoBox}>
            <Icon name="information" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              For security reasons, you must change your password before
              continuing.
            </Text>
          </View> */}

          <Input
            label="Current Password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChangeText={(text) => updateField("currentPassword", text)}
            error={errors.currentPassword}
            secureTextEntry
            editable={!loading}
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChangeText={(text) => updateField("newPassword", text)}
            error={errors.newPassword}
            secureTextEntry
            editable={!loading}
          />

          {formData.newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthSegment,
                      {
                        backgroundColor:
                          passwordStrength >= level
                            ? getStrengthColor()
                            : COLORS.grayLight,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[styles.strengthText, { color: getStrengthColor() }]}
              >
                {getStrengthLabel()}
              </Text>
            </View>
          )}

          <View style={styles.requirementsContainer}>
            {requirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Icon
                  name={
                    req.met ? "check-circle" : "checkbox-blank-circle-outline"
                  }
                  size={16}
                  color={req.met ? COLORS.success : COLORS.slateLight}
                />
                <Text
                  style={[
                    styles.requirementText,
                    req.met && styles.requirementMet,
                  ]}
                >
                  {req.label}
                </Text>
              </View>
            ))}
          </View>

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField("confirmPassword", text)}
            error={errors.confirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Button
            title="Change Password"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitButton}
            icon="lock-reset"
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
  },
  formContainer: {
    width: "100%",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryLight + "20",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.slateDark,
    lineHeight: 20,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    flexDirection: "row",
    height: 4,
    marginBottom: 8,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  requirementsContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.slate,
  },
  requirementMet: {
    color: COLORS.success,
    textDecorationLine: "line-through",
  },
  submitButton: {
    marginTop: 8,
  },
});

export default PasswordChangeForm;
