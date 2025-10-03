/**
 * Main Application Entry Point
 * Production-ready structure with centralized imports
 */

import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Screens
import SplashScreen from "./Screens/SplashScreen";
import LoginScreen from "./Screens/LoginScreen";
import SignupScreen from "./Screens/SignupScreen";
import OTPScreen from "./Screens/OTPScreen";
import SelectStore from "./Screens/SelectStore";
import MainScreen from "./Screens/MainScreen";

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={(userData) => {
                    setIsLoggedIn(true);
                    setUser(userData);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SelectStore" component={SelectStore} />
            <Stack.Screen name="MainApp">
              {(props) => (
                <MainScreen 
                  {...props} 
                  user={user} 
                  selectedStore={props.route?.params?.selectedStore}
                  onLogout={() => {
                    setIsLoggedIn(false);
                    setUser(null);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}