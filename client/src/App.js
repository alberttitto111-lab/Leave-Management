// import React from "react";
import React, { useEffect, useState } from 'react';
import { loadFonts } from './fonts';
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";
import RootNavigator from "./navigation/RootNavigator";
import { COLORS } from "./utils/constants";

import { ToastProvider } from "./contexts/ToastContext";
import { LeaveProvider } from "./contexts/LeaveContext"; // New import
import { UserProvider } from "./contexts/UserContext"; // New import

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ToastProvider>
        <AuthProvider>
          <UserProvider>
            <LeaveProvider> 
              <RootNavigator />
            </LeaveProvider>
          </UserProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
};

export default App;
