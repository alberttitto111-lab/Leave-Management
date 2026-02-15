import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS } from "../../utils/constants";

const Toast = ({ visible, message, type = "success", onHide, duration = 3000 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: COLORS.success,
          icon: "check-circle",
          iconColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: COLORS.danger,
          icon: "alert-circle",
          iconColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: COLORS.warning,
          icon: "alert",
          iconColor: "#fff",
        };
      case "info":
        return {
          backgroundColor: COLORS.info,
          icon: "information",
          iconColor: "#fff",
        };
      default:
        return {
          backgroundColor: COLORS.success,
          icon: "check-circle",
          iconColor: "#fff",
        };
    }
  };

  const toastStyle = getToastStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: toastStyle.backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name={toastStyle.icon} size={24} color={toastStyle.iconColor} />
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;