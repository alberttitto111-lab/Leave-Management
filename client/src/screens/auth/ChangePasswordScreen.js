import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import PasswordChangeForm from "../../components/auth/PasswordChangeForm";
import Loading from "../../components/common/Loading";
import { COLORS, USER_ROLES } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ChangePasswordScreen = ({ navigation }) => {
  const { changePassword, role } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        Alert.alert(
          "Success",
          "Password changed successfully. Please login with your new password.",
          [
            {
              text: "Continue",
              onPress: () => navigateToDashboard(),
            },
          ],
        );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDashboard = () => {
    switch (role) {
      case USER_ROLES.ADMIN:
        navigation.replace("AdminDashboard");
        break;
      case USER_ROLES.HOD:
        navigation.replace("HODDashboard");
        break;
      case USER_ROLES.TEACHER:
        navigation.replace("TeacherDashboard");
        break;
      case USER_ROLES.STUDENT:
        navigation.replace("StudentDashboard");
        break;
      default:
        navigation.replace("Dashboard");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="shield-lock" size={40} color={COLORS.white} />
          <Text style={styles.title}>Security Setup</Text>
          {/* <Text style={styles.subtitle}>Change your temporary password</Text> */}
        </View>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.card}>
            <PasswordChangeForm
              onSubmit={handlePasswordChange}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loading visible={loading} text="Updating password..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "auto",
    height: "auto",
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 16,
  },
  // subtitle: {
  //   fontSize: 14,
  //   color: COLORS.white,
  //   opacity: 0.9,
  //   marginTop: 4,
  // },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default ChangePasswordScreen;