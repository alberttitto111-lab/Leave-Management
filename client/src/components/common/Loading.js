import React from "react";
import { View, ActivityIndicator, StyleSheet, Text, Modal } from "react-native";
import { COLORS } from "../../utils/constants";

const Loading = ({
  visible = false,
  text = "Loading...",
  overlay = true,
  size = "large",
  color = COLORS.primary,
}) => {
  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>{content}</View>
      </Modal>
    );
  }

  return visible ? content : null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
  },
});

export default Loading;
