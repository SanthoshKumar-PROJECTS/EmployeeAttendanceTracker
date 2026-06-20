/**
 * Attendance History Screen
 * Calendar view + list of attendance records with selfie thumbnails.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import useAuthStore from '../store/useAuthStore';
import useAttendanceStore from '../store/useAttendanceStore';
import { formatTime, calculateDuration, getRelativeDay } from '../utils/dateUtils';
import CameraService from '../services/CameraService';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const AttendanceHistoryScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { history, loadHistory, isLoading, hasMoreHistory } = useAttendanceStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Only run the initial fade animation once on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  // Automatically refresh data from SQLite every time this screen is opened
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadHistory(user.id, true);
      }
    }, [user, loadHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await loadHistory(user.id, true);
    setRefreshing(false);
  }, [user, loadHistory]);

  const loadMore = useCallback(() => {
    if (hasMoreHistory && !isLoading && user) {
      loadHistory(user.id, false);
    }
  }, [hasMoreHistory, isLoading, user, loadHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in': return Colors.success;
      case 'checked_out': return Colors.accent;
      case 'auto_checked_out': return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'checked_in': return 'Checked In';
      case 'checked_out': return 'Completed';
      case 'auto_checked_out': return 'Auto-Closed';
      default: return 'Unknown';
    }
  };

  const renderRecord = useCallback(({ item, index }) => {
    const duration = calculateDuration(item.checkInTime, item.checkOutTime);
    
    // Animation delay based on index for staggered entrance
    const itemAnim = new Animated.Value(0);
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate('AttendanceDetails', { record: item })}
      >
        <Animated.View style={[styles.recordCard, { opacity: itemAnim, transform: [{ translateY: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {/* Left: Selfie Thumbnail */}
          <View style={styles.recordLeft}>
            {item.selfiePath ? (
              <Image source={{ uri: item.selfiePath.startsWith('file://') ? item.selfiePath : `file://${item.selfiePath}` }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Icon name="camera-off" size={20} color={Colors.textMuted} />
              </View>
            )}
          </View>

          {/* Middle: Details */}
          <View style={styles.recordMiddle}>
            <View style={styles.recordDateRow}>
              <Text style={styles.recordDate}>{getRelativeDay(item.date)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.statusDotSmall, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Icon name="login" size={14} color={Colors.success} />
                <Text style={styles.timeText}>{formatTime(item.checkInTime)}</Text>
              </View>
              {item.checkOutTime && (
                <>
                  <Icon name="arrow-right" size={12} color={Colors.textMuted} style={styles.timeArrow} />
                  <View style={styles.timeBlock}>
                    <Icon name="logout" size={14} color={Colors.error} />
                    <Text style={styles.timeText}>{formatTime(item.checkOutTime)}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.metaRow}>
              {item.checkOutTime && (
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{duration.formatted}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Icon name="login" size={12} color={Colors.textMuted} />
                <Text style={[styles.metaText, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                  In: {item.geofenceZone || 'Unknown'}
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: moderateScale(11), marginLeft: 4, flexShrink: 0, color: item.isWithinGeofence !== 0 ? Colors.success : Colors.error }}>
                  ({item.isWithinGeofence !== 0 ? 'Inside' : 'Outside'})
                </Text>
              </View>
              {item.checkOutTime ? (
                <View style={[styles.metaItem, { marginTop: 4 }]}>
                  <Icon name="logout" size={12} color={Colors.textMuted} />
                  <Text style={[styles.metaText, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                    Out: {item.checkOutGeofenceZone || item.geofenceZone || 'Unknown'}
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: moderateScale(11), marginLeft: 4, flexShrink: 0, color: item.isCheckOutWithinGeofence !== 0 ? Colors.success : Colors.error }}>
                    ({item.isCheckOutWithinGeofence !== 0 ? 'Inside' : 'Outside'})
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-blank" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Records Yet</Text>
      <Text style={styles.emptyText}>Your attendance history will appear here after you check in.</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CheckIn')}
      >
        <Text style={styles.emptyButtonText}>Check In Now</Text>
      </TouchableOpacity>
    </View>
  ), [navigation]);

  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{history.length}</Text>
          <Text style={styles.summaryLabel}>Total Records</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {history.filter(r => r.status === 'checked_out').length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {history.filter(r => r.isWithinGeofence).length}
          </Text>
          <Text style={styles.summaryLabel}>In Zone</Text>
        </View>
      </View>
    </View>
  ), [history]);

  const renderFooter = useCallback(() => {
    if (!hasMoreHistory) return null;
    if (isLoading) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  }, [hasMoreHistory, isLoading]);

  return (
    <ScreenWrapper scrollable={false}>
      {/* Sticky Header */}
      <View style={[styles.header, { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={Spacing.hitSlop}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: scale(24) }} />
      </View>

      {/* List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        ListHeaderComponent={history.length > 0 ? renderHeader : null}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
      </ScreenWrapper>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },
  listContent: { paddingHorizontal: Spacing.screenPadding.horizontal, paddingBottom: 20 },

  // Summary
  listHeader: { marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Spacing.radius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  summaryValue: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textSecondary, marginTop: 2 },

  // Record Card
  recordCard: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  recordLeft: { marginRight: Spacing.md },
  thumbnail: { width: scale(52), height: verticalScale(52), borderRadius: Spacing.radius.sm },
  thumbnailPlaceholder: {
    width: scale(52), height: verticalScale(52), borderRadius: Spacing.radius.sm,
    backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center',
  },
  recordMiddle: { flex: 1 },
  recordDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  recordDate: { fontFamily: Fonts.semiBold, fontSize: moderateScale(14), color: Colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: moderateScale(12) },
  statusDotSmall: { width: scale(6), height: verticalScale(6), borderRadius: moderateScale(3), marginRight: 4 },
  statusText: { fontFamily: Fonts.semiBold, fontSize: moderateScale(10) },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  timeBlock: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontFamily: Fonts.regular, fontSize: moderateScale(13), color: Colors.textSecondary, marginLeft: 4, fontVariant: ['tabular-nums'] },
  timeArrow: { marginHorizontal: 6 },

  metaRow: { flexDirection: 'column', gap: 6, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textMuted, marginLeft: 3 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: moderateScale(20), color: Colors.textPrimary, marginTop: Spacing.lg },
  emptyText: { fontFamily: Fonts.regular, fontSize: moderateScale(14), color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', paddingHorizontal: Spacing.xxl },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: Spacing.radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.xl,
  },
  emptyButtonText: { fontFamily: Fonts.semiBold, color: Colors.white, fontSize: moderateScale(15) },

  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
  loadingMoreText: { fontFamily: Fonts.regular, color: Colors.textMuted, fontSize: moderateScale(13) },
});

export default AttendanceHistoryScreen;
