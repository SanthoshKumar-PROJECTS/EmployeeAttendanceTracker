/**
 * Profile Screen
 * User profile, change password, export data, and logout.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import useAuthStore from '../store/useAuthStore';
import useAttendanceStore from '../store/useAttendanceStore';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const MenuItem = ({ icon, label, value, color = Colors.textPrimary, onPress, rightIcon = 'chevron-right' }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconContainer, { backgroundColor: (color || Colors.primary) + '15' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
    </View>
    <Icon name={rightIcon} size={20} color={Colors.textMuted} />
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const { reset: resetAttendance } = useAttendanceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editDept, setEditDept] = useState(user?.department || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const validateProfile = () => {
    const newErrors = {};
    if (!editName.trim()) newErrors.fullName = 'Full name is required';
    
    const cleanedPhone = editPhone.trim().replace(/[^0-9]/g, '');
    if (cleanedPhone && cleanedPhone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    const cleanedPhone = editPhone.trim().replace(/[^0-9]/g, '');
    const result = await updateProfile({
      fullName: editName.trim(),
      department: editDept.trim(),
      phone: cleanedPhone,
    });
    if (result.success) {
      setIsEditing(false);
      setErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!currentPwd) newErrors.currentPwd = 'Current password is required';
    
    if (!newPwd) {
      newErrors.newPwd = 'New password is required';
    } else if (strength.level < 4) {
      newErrors.newPwd = 'Password must be Strong';
    }
    
    if (!confirmPwd) newErrors.confirmPwd = 'Confirm password is required';
    else if (newPwd !== confirmPwd) newErrors.confirmPwd = 'New passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    const result = await changePassword(currentPwd, newPwd);
    if (result.success) {
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setErrors({});
      setConfirmPwd('');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const getPasswordStrength = () => {
    if (!newPwd) return { level: 0, label: '', color: Colors.textMuted, missing: [] };
    let score = 0;
    const missing = [];

    if (newPwd.length >= 6) {
      score += 1;
    } else {
      missing.push('6+ chars');
    }

    if (/[A-Z]/.test(newPwd)) { score++; } else { missing.push('Uppercase'); }
    if (/[0-9]/.test(newPwd)) { score++; } else { missing.push('Number'); }
    if (/[^A-Za-z0-9]/.test(newPwd)) { score++; } else { missing.push('Symbol'); }

    if (missing.length === 0) return { level: 4, label: 'Strong', color: Colors.success, missing: [] };
    if (score <= 1) return { level: 1, label: 'Weak', color: Colors.error, missing };
    if (score <= 2) return { level: 2, label: 'Fair', color: Colors.warning, missing };
    return { level: 3, label: 'Good', color: Colors.accent, missing };
  };

  const strength = getPasswordStrength();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            resetAttendance();
            await logout();
          },
        },
      ]
    );
  };
  return (
    <ScreenWrapper scrollable={false}>
      {/* Sticky Header */}
      <View style={[styles.header, { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={Spacing.hitSlop}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)} hitSlop={Spacing.hitSlop}>
          <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.avatarGlow} />
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={[styles.editInput, errors.fullName && styles.inputError]}
              value={editName}
              onChangeText={(text) => {
                setEditName(text);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
              placeholder="Full Name *"
              placeholderTextColor={Colors.textMuted}
            />
            {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}

            <TextInput
              style={styles.editInput}
              value={editDept}
              onChangeText={setEditDept}
              placeholder="Department"
              placeholderTextColor={Colors.textMuted}
            />

            <TextInput
              style={[styles.editInput, errors.phone && styles.inputError]}
              value={editPhone}
              onChangeText={(text) => {
                setEditPhone(text.replace(/[^0-9]/g, ''));
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="Phone"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
          </View>
        ) : (
          <>
            <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
              {user?.fullName || 'Employee'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {user?.department ? (
              <View style={styles.deptBadge}>
                <Icon name="domain" size={12} color={Colors.primary} />
                <Text style={styles.deptText}>{user.department}</Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuSection}>
        <MenuItem
          icon="lock-reset"
          label="Change Password"
          color={Colors.primary}
          onPress={() => {
            setShowChangePassword(!showChangePassword);
            setErrors({});
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
          }}
          rightIcon={showChangePassword ? 'chevron-up' : 'chevron-down'}
        />
        {showChangePassword && (
          <View style={styles.changePasswordSection}>
            <View style={[styles.pwdInputWrapper, errors.currentPwd && styles.inputError]}>
              <TextInput
                style={styles.pwdInput}
                placeholder="Current Password *"
                placeholderTextColor={Colors.textMuted}
                value={currentPwd}
                onChangeText={(text) => {
                  setCurrentPwd(text);
                  if (errors.currentPwd) setErrors(prev => ({ ...prev, currentPwd: '' }));
                }}
                secureTextEntry={!showCurrentPwd}
              />
              <TouchableOpacity style={styles.pwdIcon} onPress={() => setShowCurrentPwd(!showCurrentPwd)}>
                <Icon name={showCurrentPwd ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.currentPwd ? <Text style={styles.fieldError}>{errors.currentPwd}</Text> : null}

            <View style={[styles.pwdInputWrapper, errors.newPwd && styles.inputError]}>
              <TextInput
                style={styles.pwdInput}
                placeholder="New Password *"
                placeholderTextColor={Colors.textMuted}
                value={newPwd}
                onChangeText={(text) => {
                  setNewPwd(text);
                  if (errors.newPwd) setErrors(prev => ({ ...prev, newPwd: '' }));
                }}
                secureTextEntry={!showNewPwd}
              />
              <TouchableOpacity style={styles.pwdIcon} onPress={() => setShowNewPwd(!showNewPwd)}>
                <Icon name={showNewPwd ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.newPwd ? <Text style={styles.fieldError}>{errors.newPwd}</Text> : null}
            {newPwd.length > 0 && (
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
            {newPwd.length > 0 && strength.missing.length > 0 && (
              <Text style={styles.passwordHint}>
                Needed: {strength.missing.join(', ')}
              </Text>
            )}

            <View style={[styles.pwdInputWrapper, errors.confirmPwd && styles.inputError]}>
              <TextInput
                style={styles.pwdInput}
                placeholder="Confirm New Password *"
                placeholderTextColor={Colors.textMuted}
                value={confirmPwd}
                onChangeText={(text) => {
                  setConfirmPwd(text);
                  if (errors.confirmPwd) setErrors(prev => ({ ...prev, confirmPwd: '' }));
                }}
                secureTextEntry={!showConfirmPwd}
              />
              <TouchableOpacity style={styles.pwdIcon} onPress={() => setShowConfirmPwd(!showConfirmPwd)}>
                <Icon name={showConfirmPwd ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.confirmPwd ? <Text style={styles.fieldError}>{errors.confirmPwd}</Text> : null}
            <TouchableOpacity style={styles.changePwdButton} onPress={handleChangePassword}>
              <Text style={styles.changePwdButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* App Info */}
      <Text style={styles.sectionTitle}>App Info</Text>
      <View style={styles.menuSection}>
        <MenuItem
          icon="information-outline"
          label="App Version"
          value="1.0.0"
          color={Colors.textSecondary}
          onPress={() => { }}
          rightIcon=""
        />
        <MenuItem
          icon="cog"
          label="Settings"
          value=""
          color={Colors.textSecondary}
          onPress={() => navigation.navigate('Settings')}
          rightIcon="chevron-right"
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Icon name="logout" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.xl, paddingBottom: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },
  editButton: { fontFamily: Fonts.semiBold, fontSize: moderateScale(15), color: Colors.primary },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.base },
  avatar: {
    width: scale(80), height: verticalScale(80), borderRadius: moderateScale(40),
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: moderateScale(32), color: Colors.white },
  avatarGlow: {
    position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: moderateScale(46), backgroundColor: Colors.primaryGlow, zIndex: -1,
  },
  profileName: { fontFamily: Fonts.bold, fontSize: moderateScale(22), color: Colors.textPrimary },
  profileEmail: { fontFamily: Fonts.regular, fontSize: moderateScale(14), color: Colors.textSecondary, marginTop: 4 },
  deptBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm,
    backgroundColor: Colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 4, borderRadius: moderateScale(12),
  },
  deptText: { fontFamily: Fonts.medium, fontSize: moderateScale(12), color: Colors.primary, marginLeft: 4 },

  // Edit Form
  editForm: { width: '100%', marginTop: Spacing.sm },
  editInput: {
    fontFamily: Fonts.regular,
    backgroundColor: Colors.surfaceLight, borderRadius: Spacing.radius.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: moderateScale(15), marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },

  // Sections
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(13), color: Colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm, marginLeft: 4,
  },
  menuSection: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  menuIconContainer: {
    width: scale(36), height: verticalScale(36), borderRadius: moderateScale(18), justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  menuContent: { flex: 1 },
  menuLabel: { fontFamily: Fonts.medium, fontSize: moderateScale(15), color: Colors.textPrimary },
  menuValue: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textMuted, marginTop: 2 },

  // Change Password
  changePasswordSection: {
    padding: Spacing.base, backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  pwdInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  pwdInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: moderateScale(14),
  },
  pwdIcon: {
    padding: Spacing.md,
  },
  inputError: {
    borderColor: Colors.error,
  },
  fieldError: {
    fontFamily: Fonts.medium,
    color: Colors.error,
    fontSize: moderateScale(12),
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, marginBottom: Spacing.sm },
  strengthBar: { flex: 1, flexDirection: 'row', gap: 4, marginRight: Spacing.sm },
  strengthSegment: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontFamily: Fonts.medium, fontSize: moderateScale(11), width: 45, textAlign: 'right' },
  passwordHint: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textMuted, marginTop: -Spacing.xs, marginBottom: Spacing.sm },
  changePwdButton: {
    backgroundColor: Colors.primary, borderRadius: Spacing.radius.sm,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xs,
  },
  changePwdButtonText: { fontFamily: Fonts.semiBold, color: Colors.white, fontSize: moderateScale(14) },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.errorGlow, borderRadius: Spacing.radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontFamily: Fonts.semiBold, color: Colors.error, fontSize: moderateScale(16), marginLeft: Spacing.sm },
});

export default ProfileScreen;
