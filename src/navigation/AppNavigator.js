/**
 * App Navigator
 * Root navigator — switches between Auth and Main based on auth state.
 */

import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { Colors } from '../theme/colors';
import useAuthStore from '../store/useAuthStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LottieView from 'lottie-react-native';
import findingRouteAnimation from '../../assets/animations/ABC1.json';

// Dark theme for navigation, extending default theme to inherit required v7 configurations (like fonts)
const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.error,
  },
};

// Light theme for navigation
const LightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: Colors.primary,
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A202C',
    border: '#E2E8F0',
    notification: Colors.error,
  },
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  // Show splash/loading screen during session restore
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <LottieView
          source={findingRouteAnimation}
          autoPlay
          loop
          style={styles.lottieAnimation}
          resizeMode="contain" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  lottieAnimation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AppNavigator;
