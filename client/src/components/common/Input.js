import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../utils/constants";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon,
  onIconPress,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const isPasswordField = secureTextEntry;
  const isSecure = isPasswordField && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && styles.inputMultiline,
        ]}
      >
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={COLORS.slate}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.slateLight}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          {...props}
        />

        {isPasswordField && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}
          >
            <Icon
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color={COLORS.slate}
            />
          </TouchableOpacity>
        )}

        {onIconPress && !isPasswordField && (
          <TouchableOpacity onPress={onIconPress} style={styles.rightIcon}>
            <Icon name={icon} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.slateDark,
    paddingVertical: 12,
  },
  inputWithIcon: {
    marginLeft: 12,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight + "20", // 20% opacity
  },
  inputDisabled: {
    backgroundColor: COLORS.grayLight,
    opacity: 0.7,
  },
  inputMultiline: {
    minHeight: 100,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  multilineInput: {
    textAlignVertical: "top",
    height: 100,
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginLeft: 6,
  },
});

export default Input;
