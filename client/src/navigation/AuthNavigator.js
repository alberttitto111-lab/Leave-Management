import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import { COLORS } from "../utils/constants";

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { requiresPasswordChange } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      {requiresPasswordChange ? (
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ gestureEnabled: false }}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ gestureEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
