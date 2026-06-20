/**
 * Dashboard Screen
 * Shows today's status, weekly stats, monthly analytics, and quick actions.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import useAuthStore from '../store/useAuthStore';
import useAttendanceStore from '../store/useAttendanceStore';
import { getWeekDates, getISTGreeting } from '../utils/dateUtils';
import LiveTimer from '../components/LiveTimer';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { todayStatus, dashboardStats, weeklyRecords, loadDashboardStats, loadWeeklyRecords } = useAttendanceStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      loadDashboardStats(user.id);
      loadWeeklyRecords(user.id);
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [user, loadDashboardStats, loadWeeklyRecords, fadeAnim]);

  // Live timer logic is now handled in isolation by <LiveTimer />

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await loadDashboardStats(user.id);
      await loadWeeklyRecords(user.id);
    }
    setRefreshing(false);
  }, [user, loadDashboardStats, loadWeeklyRecords]);

  const getStatusConfig = () => {
    const status = todayStatus?.status || 'not_checked_in';
    switch (status) {
      case 'checked_in':
        return {
          icon: 'clock-check-outline',
          label: 'Checked In',
          color: Colors.success,
          glow: Colors.successGlow,
          bgColor: 'rgba(0, 230, 118, 0.08)',
        };
      case 'available':
        return {
          icon: 'check-circle-outline',
          label: `Today: ${todayStatus?.totalHoursToday || '0.0'}h logged`,
          color: Colors.accent,
          glow: Colors.accentGlow,
          bgColor: 'rgba(0, 217, 255, 0.08)',
        };
      default:
        return {
          icon: 'clock-outline',
          label: 'Not Checked In',
          color: Colors.warning,
          glow: Colors.warningGlow,
          bgColor: 'rgba(255, 179, 0, 0.08)',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const weekDates = getWeekDates();
  const stats = dashboardStats;

  // Build weekly data — memoized to prevent re-calculating on every render
  const weekData = React.useMemo(() => {
    return weekDates.map((day) => {
      const hasRecord = weeklyRecords.some((r) => r.date === day.date);
      return { ...day, hasAttendance: hasRecord };
    });
  }, [weekDates, weeklyRecords]);

  return (
    <ScreenWrapper scrollable={false}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Sticky Header */}
        <View style={[styles.header, { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={styles.greeting}>Good {getISTGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {user?.fullName?.split(' ')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Icon name="account-circle" size={36} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
        {/* Today's Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.color + '30' }]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.glow }]}>
              <Icon name={statusConfig.icon} size={28} color={statusConfig.color} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              {todayStatus?.status === 'checked_in' && (
                <LiveTimer startTime={todayStatus?.activeSession?.checkInTime} textStyle={styles.timerText} />
              )}
              {todayStatus?.status === 'available' && todayStatus?.todaySessions?.length > 0 && (
                <Text style={styles.statusTime}>
                  {todayStatus.todaySessions.length} session{todayStatus.todaySessions.length > 1 ? 's' : ''} completed
                </Text>
              )}
              {todayStatus?.status === 'not_checked_in' && (
                <Text style={styles.statusTime}>Tap to mark attendance</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: statusConfig.color }]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Icon
              name={todayStatus?.status === 'checked_in' ? 'location-exit' : 'login'}
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar-check"
            label="This Week"
            value={`${stats?.week?.count || 0} days`}
            color={Colors.primary}
          />
          <StatCard
            icon="clock-fast"
            label="Avg Hours"
            value={`${stats?.overall?.averageHours || '0.0'}h`}
            color={Colors.accent}
          />
          <StatCard
            icon="fire"
            label="Streak"
            value={`${stats?.overall?.streak || 0} days`}
            color={Colors.warning}
          />
        </View>

        {/* Weekly Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {weekData.map((day) => (
              <View key={day.date} style={styles.dayColumn}>
                <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>{day.dayName}</Text>
                <View
                  style={[
                    styles.dayDot,
                    day.hasAttendance ? styles.dayDotActive : styles.dayDotInactive,
                    day.isToday && !day.hasAttendance && styles.dayDotToday,
                  ]}
                >
                  {day.hasAttendance ? (
                    <Icon name="check" size={14} color={Colors.white} />
                  ) : (
                    <Text style={styles.dayNumber}>{day.dayNumber}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            <Text style={styles.sectionSubtitle}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.monthlyStats}>
            <View style={styles.monthStat}>
              <Text style={styles.monthStatValue}>{stats?.month?.count || 0}</Text>
              <Text style={styles.monthStatLabel}>Days Present</Text>
            </View>
            <View style={styles.monthStatDivider} />
            <View style={styles.monthStat}>
              <Text style={styles.monthStatValue}>{stats?.overall?.totalDays || 0}</Text>
              <Text style={styles.monthStatLabel}>Total Records</Text>
            </View>
            <View style={styles.monthStatDivider} />
            <View style={styles.monthStat}>
              <Text style={styles.monthStatValue}>{stats?.overall?.averageHours || '0'}h</Text>
              <Text style={styles.monthStatLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionTile icon="map-marker-check" label="Check In" color={Colors.primary} onPress={() => navigation.navigate('CheckIn')} />
            <ActionTile icon="history" label="History" color={Colors.accent} onPress={() => navigation.navigate('History')} />
            <ActionTile icon="map-marker-radius" label="Geofences" color={Colors.success} onPress={() => navigation.navigate('Settings')} />
            <ActionTile icon="account" label="Profile" color={Colors.warning} onPress={() => navigation.navigate('Profile')} />
          </View>
        </View>
        </ScrollView>
      </Animated.View>
    </ScreenWrapper>
  );
};

// Sub-components
const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={20} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionTile = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionTileIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={22} color={color} />
    </View>
    <Text style={styles.actionTileLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.xl, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontFamily: Fonts.regular, fontSize: moderateScale(14), color: Colors.textSecondary },
  userName: { fontFamily: Fonts.bold, fontSize: moderateScale(24), color: Colors.textPrimary, marginTop: 2 },
  profileButton: { width: scale(44), height: verticalScale(44), borderRadius: moderateScale(22), backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },

  // Status Card
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: Spacing.radius.lg, padding: Spacing.base,
    borderWidth: 1, marginBottom: Spacing.lg,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusIconContainer: { width: scale(52), height: verticalScale(52), borderRadius: moderateScale(26), justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  statusInfo: { flex: 1 },
  statusLabel: { fontFamily: Fonts.bold, fontSize: moderateScale(16) },
  timerText: { fontFamily: Fonts.bold, fontSize: moderateScale(22), color: Colors.textPrimary, marginTop: 2, fontVariant: ['tabular-nums'] },
  statusTime: { fontFamily: Fonts.regular, fontSize: moderateScale(13), color: Colors.textSecondary, marginTop: 2 },
  actionButton: { width: scale(44), height: verticalScale(44), borderRadius: moderateScale(22), justifyContent: 'center', alignItems: 'center' },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.radius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontFamily: Fonts.bold, fontSize: moderateScale(16), color: Colors.textPrimary, marginTop: Spacing.sm },
  statLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textSecondary, marginTop: 2 },

  // Section Card
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    padding: Spacing.base, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: Fonts.semiBold, fontSize: moderateScale(16), color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionSubtitle: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textSecondary },

  // Week Row
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayName: { fontFamily: Fonts.medium, fontSize: moderateScale(11), color: Colors.textMuted, marginBottom: Spacing.sm },
  dayNameToday: { fontFamily: Fonts.bold, color: Colors.primary },
  dayDot: { width: scale(32), height: verticalScale(32), borderRadius: moderateScale(16), justifyContent: 'center', alignItems: 'center' },
  dayDotActive: { backgroundColor: Colors.success },
  dayDotInactive: { backgroundColor: Colors.surfaceLight },
  dayDotToday: { borderWidth: 2, borderColor: Colors.primary },
  dayNumber: { fontFamily: Fonts.medium, fontSize: moderateScale(11), color: Colors.textMuted },

  // Monthly stats
  monthlyStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  monthStat: { flex: 1, alignItems: 'center' },
  monthStatValue: { fontFamily: Fonts.bold, fontSize: moderateScale(22), color: Colors.textPrimary },
  monthStatLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textSecondary, marginTop: 2 },
  monthStatDivider: { width: 1, height: verticalScale(36), backgroundColor: Colors.border },

  // Actions
  actionsSection: { marginBottom: Spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: {
    width: (SCREEN_WIDTH - 40 - 10) / 2 - 5,
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.md,
    padding: Spacing.base, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  actionTileIcon: { width: scale(44), height: verticalScale(44), borderRadius: moderateScale(22), justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  actionTileLabel: { fontFamily: Fonts.medium, fontSize: moderateScale(13), color: Colors.textPrimary },
});

export default DashboardScreen;
