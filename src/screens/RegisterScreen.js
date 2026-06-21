/**
 * Register Screen
 * User registration with local account creation.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import useAuthStore from '../store/useAuthStore';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, isAuthLoading: isLoading, error, clearError } = useAuthStore();
  const isFocused = useIsFocused();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useFocusEffect(
    React.useCallback(() => {
      clearError();
    }, [clearError])
  );

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (strength.level < 4) errs.password = 'Password must be Strong';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (phone && phone.replace(/[^0-9]/g, '').length !== 10) errs.phone = 'Phone must be exactly 10 digits';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    clearError();
    await register({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      department: department.trim(),
      phone: phone.trim(),
    });
  };

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: Colors.textMuted, missing: [] };
    let score = 0;
    const missing = [];

    if (password.length >= 6) {
      score += 1;
    } else {
      missing.push('6+ chars');
    }

    if (/[A-Z]/.test(password)) { score++; } else { missing.push('Uppercase'); }
    if (/[0-9]/.test(password)) { score++; } else { missing.push('Number'); }
    if (/[^A-Za-z0-9]/.test(password)) { score++; } else { missing.push('Symbol'); }

    if (missing.length === 0) return { level: 4, label: 'Strong', color: Colors.success, missing: [] };
    if (score <= 1) return { level: 1, label: 'Weak', color: Colors.error, missing };
    if (score <= 2) return { level: 2, label: 'Fair', color: Colors.warning, missing };
    return { level: 3, label: 'Good', color: Colors.accent, missing };
  };

  const strength = getPasswordStrength();

  const renderInput = (icon, placeholder, value, onChangeText, key, options = {}) => (
    <View style={styles.inputGroup}>
      {options.label && <Text style={styles.inputLabel}>{options.label}</Text>}
      <View style={[styles.inputContainer, errors[key] ? styles.inputError : null]}>
        <Icon name={icon} size={20} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (errors[key]) {
              const newErrors = { ...errors };
              delete newErrors[key];
              setErrors(newErrors);
            }
          }}
          editable={!isLoading}
          {...options.inputProps}
        />
        {options.rightIcon}
      </View>
      {errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <ScreenWrapper
      scrollable={false}
      keyboardAvoiding={true}
    >
          {/* Sticky Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={Spacing.hitSlop}
            >
              <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Fill in your details to get started</Text>
          </Animated.View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: 0, paddingBottom: Math.max(useSafeAreaInsets().bottom, 24) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Form */}
          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {isFocused && error ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {renderInput('account-outline', 'Full Name', fullName, setFullName, 'fullName', {
              label: 'Full Name *',
              inputProps: { autoCapitalize: 'words' },
            })}

            {renderInput('email-outline', 'Email Address', email, setEmail, 'email', {
              label: 'Email *',
              inputProps: { keyboardType: 'email-address', autoCapitalize: 'none' },
            })}

            {renderInput('domain', 'Department', department, setDepartment, 'department', {
              label: 'Department',
              inputProps: { autoCapitalize: 'words' },
            })}

            {renderInput('phone-outline', 'Phone Number', phone, (text) => setPhone(text.replace(/[^0-9]/g, '')), 'phone', {
              label: 'Phone',
              inputProps: { keyboardType: 'phone-pad', maxLength: 10 },
            })}

            {/* Password with strength meter */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <Icon name="lock-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      const newErrors = { ...errors };
                      delete newErrors.password;
                      setErrors(newErrors);
                    }
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={Spacing.hitSlop}>
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: level <= strength.level ? strength.color : Colors.surfaceLight },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
              {password.length > 0 && strength.missing.length > 0 && (
                <Text style={styles.passwordHint}>
                  Needed: {strength.missing.join(', ')}
                </Text>
              )}
            </View>

            {renderInput('lock-check-outline', 'Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', {
              label: 'Confirm Password *',
              inputProps: { secureTextEntry: !showPassword },
            })}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Icon name="account-plus" size={20} color={Colors.white} />
                  <Text style={styles.registerButtonText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
          </ScrollView>
      </ScreenWrapper>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding.horizontal,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  header: { marginBottom: Spacing.xl },
  backButton: {
    width: scale(40), height: verticalScale(40), borderRadius: moderateScale(20),
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.base,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(28), color: Colors.textPrimary },
  headerSubtitle: { fontFamily: Fonts.regular, fontSize: moderateScale(14), color: Colors.textSecondary, marginTop: Spacing.xs },
  form: {},
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.errorGlow, borderRadius: Spacing.radius.md,
    padding: Spacing.md, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
  },
  errorBannerText: { fontFamily: Fonts.regular, color: Colors.error, fontSize: moderateScale(13), marginLeft: Spacing.sm, flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(13), color: Colors.textSecondary,
    marginBottom: Spacing.xs, letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.base, height: verticalScale(50),
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: Spacing.md },
  input: { fontFamily: Fonts.regular, flex: 1, fontSize: moderateScale(15), color: Colors.textPrimary, height: '100%' },
  fieldError: { fontFamily: Fonts.regular, color: Colors.error, fontSize: moderateScale(12), marginTop: 4, marginLeft: 4 },
  strengthContainer: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row', flex: 1, gap: 4,
  },
  strengthSegment: {
    flex: 1, height: verticalScale(4), borderRadius: moderateScale(2),
  },
  strengthLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(12), marginLeft: Spacing.sm,
  },
  passwordHint: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(11), color: Colors.textSecondary,
    marginTop: 6, marginLeft: 4,
  },
  registerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Spacing.radius.md,
    height: verticalScale(52), marginTop: Spacing.lg,
    ...Spacing.shadows.glow,
  },
  buttonDisabled: { opacity: 0.6 },
  registerButtonText: { fontFamily: Fonts.semiBold, color: Colors.white, fontSize: moderateScale(16), marginLeft: Spacing.sm },
  loginLink: { alignItems: 'center', marginTop: Spacing.xl },
  loginLinkText: { fontFamily: Fonts.regular, color: Colors.textSecondary, fontSize: moderateScale(14) },
  loginLinkHighlight: { fontFamily: Fonts.semiBold, color: Colors.primary },
});

export default RegisterScreen;
