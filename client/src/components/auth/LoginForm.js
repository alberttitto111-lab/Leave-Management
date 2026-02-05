import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../utils/constants";

const LoginForm = ({ onSubmit, loading }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    // ✅ Only basic required validation — nothing else
    if (!userId.trim() || !password.trim()) {
      setError("User ID and Password are required");
      return;
    }

    setError("");
    onSubmit(userId.trim(), password);
  };

  return (
    <View>
      {/* USER ID */}
      <View style={styles.inputContainer}>
        <Icon name="account-outline" size={20} color={COLORS.slate} />
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
          autoCapitalize="none"
        />
      </View>

      {/* PASSWORD */}
      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={20} color={COLORS.slate} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.slate}
          />
        </TouchableOpacity>
      </View>

      {/* ERROR */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.slateDark,
  },

  error: {
    color: "#d32f2f",
    fontSize: 12,
    marginBottom: 12,
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
