import React from 'react';
import { View, StyleSheet, ScrollView, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

const ScreenWrapper = ({
  children,
  scrollable = false,
  keyboardAvoiding = false,
  minPaddingTop = Spacing.xl,
  style,
  contentContainerStyle,
  keyboardAvoidingProps,
  ...rest
}) => {
  const insets = useSafeAreaInsets();
  
  const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const paddingTop = Math.max(safeTop, minPaddingTop);
  // Give extra padding for gesture bars, especially important for scrollable lists
  const safeBottom = Math.max(insets.bottom, 24);

  let inner = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        { paddingBottom: safeBottom }, // Add safe bottom to scroll content
        contentContainerStyle,
        { paddingTop }
      ]}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingBottom: 0 }, contentContainerStyle, { paddingTop }]} {...rest}>
      {children}
    </View>
  );

  if (keyboardAvoiding) {
    inner = (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        {...keyboardAvoidingProps}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Sticky Status Bar Background */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: safeTop,
          backgroundColor: Colors.background,
          zIndex: 999,
          elevation: 0,
        }} 
      />
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default ScreenWrapper;
