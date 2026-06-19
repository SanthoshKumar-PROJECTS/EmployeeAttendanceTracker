/**
 * Login Screen
 * Secure login with email/password and biometric authentication.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import useAuthStore from '../store/useAuthStore';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, loginWithBiometric, isLoading, error, clearError, biometricInfo } = useAuthStore();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!re.test(value)) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    clearError();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    await login(email.trim(), password);
  };

  const handleBiometricLogin = async () => {
    clearError();
    await loginWithBiometric();
  };

  return (
    <ScreenWrapper
      scrollable={true}
      keyboardAvoiding={true}
      minPaddingTop={Spacing.xxl}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
          {/* Logo & Header */}
          <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Icon name="fingerprint" size={48} color={Colors.primary} />
              </View>
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.appTitle}>Employee Tracker</Text>
            <Text style={styles.appSubtitle}>Mark your attendance securely</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Error Banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                <Icon name="email-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                <Icon name="lock-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={Spacing.hitSlop}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Icon name="login" size={20} color={Colors.white} />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Biometric Login */}
            {biometricInfo?.available && biometricInfo?.hasStoredCredentials && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.biometricIconContainer}>
                  <Icon name={biometricInfo?.icon || 'fingerprint'} size={28} color={Colors.primary} />
                </View>
                <Text style={styles.biometricText}>
                  Login with {biometricInfo.label || 'Biometrics'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
      </ScreenWrapper>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding.horizontal,
    paddingVertical: Spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: scale(96),
    height: verticalScale(96),
    borderRadius: moderateScale(48),
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryGlow,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: moderateScale(58),
    backgroundColor: Colors.primaryGlow,
    opacity: 0.3,
    zIndex: -1,
  },
  appTitle: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(28),
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(14),
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formSection: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorGlow,
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  errorBannerText: {
    fontFamily: Fonts.regular,
    color: Colors.error,
    fontSize: moderateScale(13),
    marginLeft: Spacing.sm,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(13),
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    height: verticalScale(52),
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    fontFamily: Fonts.regular,
    flex: 1,
    fontSize: moderateScale(15),
    color: Colors.textPrimary,
    height: '100%',
  },
  fieldError: {
    fontFamily: Fonts.regular,
    color: Colors.error,
    fontSize: moderateScale(12),
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.md,
    height: verticalScale(52),
    marginTop: Spacing.lg,
    ...Spacing.shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    fontSize: moderateScale(16),
    marginLeft: Spacing.sm,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Spacing.radius.md,
    height: verticalScale(52),
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  biometricIconContainer: {
    marginRight: Spacing.sm,
  },
  biometricText: {
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.semiBold,
    color: Colors.textMuted,
    fontSize: moderateScale(12),
    marginHorizontal: Spacing.base,
    letterSpacing: 1,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontSize: moderateScale(14),
  },
  registerLink: {
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
});

export default LoginScreen;
