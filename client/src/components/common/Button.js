import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../utils/constants";

const Button = ({
  title,
  onPress,
  variant = "primary", // primary, secondary, outline, danger, ghost
  size = "medium", // small, medium, large
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
      case "secondary":
        return {
          button: styles.secondaryButton,
          text: styles.secondaryText,
        };
      case "outline":
        return {
          button: styles.outlineButton,
          text: styles.outlineText,
        };
      case "danger":
        return {
          button: styles.dangerButton,
          text: styles.dangerText,
        };
      case "ghost":
        return {
          button: styles.ghostButton,
          text: styles.ghostText,
        };
      default:
        return {
          button: styles.primaryButton,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return styles.smallButton;
      case "large":
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.white
          }
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" && (
            <Icon
              name={icon}
              size={size === "small" ? 16 : 20}
              color={variantStyles.text.color}
              style={styles.leftIcon}
            />
          )}

          <Text style={[styles.text, variantStyles.text, textStyle]}>
            {title}
          </Text>

          {icon && iconPosition === "right" && (
            <Icon
              name={icon}
              size={size === "small" ? 16 : 20}
              color={variantStyles.text.color}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.slate,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  ghostText: {
    color: COLORS.primary,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
