import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import LoginForm from "../../components/auth/LoginForm";
import Loading from "../../components/common/Loading";
import { COLORS, MESSAGES, USER_ROLES } from "../../utils/constants";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const LoginScreen = ({ navigation }) => {
  const { login, isAuthenticated, role, requiresPasswordChange } = useAuth();
  const [loading, setLoading] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      if (requiresPasswordChange) {
        navigation.replace("ChangePassword");
      } else {
        // Navigate to appropriate dashboard based on role
        navigateToDashboard();
      }
    }
  }, [isAuthenticated, requiresPasswordChange, role]);

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

  const handleLogin = async (userId, password) => {
    setLoading(true);
    try {
      const result = await login(userId, password);

      if (!result.success) {
        Alert.alert("Login Failed", result.message || MESSAGES.LOGIN_ERROR);
      }
      // Navigation handled by useEffect
    } catch (error) {
      Alert.alert("Error", error.message || MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Icon name="calendar-check" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Leave Management</Text>
          <Text style={styles.subtitle}>Academic Portal</Text>
        </View>
      </View>

      {/* Login Form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.description}>
              Please sign in with your credentials to access your account.
            </Text>

            <LoginForm onSubmit={handleLogin} loading={loading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Forgot your password? Contact your administrator
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <Loading visible={loading} text="Authenticating..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
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
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.slateDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.slate,
    marginBottom: 24,
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.slateLight,
    textAlign: "center",
  },
});

export default LoginScreen;
