import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import Loading from "../components/common/Loading";
import { navigationRef } from "./navigationRef";

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, requiresPasswordChange, loading } = useAuth();

  if (loading) {
    return <Loading visible text="Initializing..." overlay />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || requiresPasswordChange ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="App" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
