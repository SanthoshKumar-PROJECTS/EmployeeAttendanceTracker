/**
 * Check-In Screen
 * GPS capture, geofence verification, selfie capture, and check-in/out actions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import useAlertStore from '../store/useAlertStore';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomCameraModal from '../components/CustomCameraModal';
import useAuthStore from '../store/useAuthStore';
import useAttendanceStore from '../store/useAttendanceStore';
import LocationService from '../services/LocationService';
import GeofenceService from '../services/GeofenceService';
import CameraService from '../services/CameraService';
import LiveTimer from '../components/LiveTimer';
import { formatTime, calculateDuration } from '../utils/dateUtils';
import { getISTGreeting } from '../utils/dateUtils';
import { formatDistance } from '../utils/geofencing';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#12121c" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12121c" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#a29bfe" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c2c3c" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a9a" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#161622" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#222230" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1a1a24" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a9a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0a14" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4a4a5a" }] }
];

const CheckInScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { todayStatus, checkIn, checkOut, isCheckingIn, isCheckingOut, loadTodayStatus, error, clearError } = useAttendanceStore();

  const [location, setLocation] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('auto');
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [selfiePath, setSelfiePath] = useState(null);
  const [selfieUri, setSelfieUri] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchLocationAndZones = async () => {
    try {
      const allZones = await GeofenceService.getAllZones();
      setZones(allZones);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
    await fetchLocation();
  };

  useFocusEffect(
    useCallback(() => {
      if (user) loadTodayStatus(user.id);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      fetchLocationAndZones();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])
  );

  // Pulse animation for the check-in button
  useEffect(() => {
    if (todayStatus?.status !== 'checked_in') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [todayStatus, pulseAnim]);

  const fetchLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const pos = await LocationService.getCurrentPosition();
      setLocation(pos);

      // Check geofence
      const gfResult = await GeofenceService.checkPosition(pos, selectedZoneId);
      setGeofenceStatus(gfResult);

      // Fetch place name
      try {
        const name = await LocationService.getPlaceName(pos.latitude, pos.longitude);
        setPlaceName(name);
      } catch (placeErr) {
        console.warn('Failed to fetch place name:', placeErr);
        if (!placeName) setPlaceName('Location Name Unavailable');
      }
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocationLoading(false);
    }
  };


  // Recalculate geofence when selected zone changes
  useEffect(() => {
    if (location) {
      GeofenceService.checkPosition(location, selectedZoneId).then(setGeofenceStatus);
    }
  }, [selectedZoneId, location]);

  const handleCaptureSelfie = () => {
    setIsCameraModalVisible(true);
  };

  const handlePhotoCaptured = async (tempPath) => {
    try {
      setIsCameraModalVisible(false);
      const result = await CameraService.processCapturedPhoto(tempPath, user.id);
      if (result) {
        setSelfiePath(result.path);
        setSelfieUri(result.uri);
      }
    } catch (err) {
      useAlertStore.getState().showAlert('Camera Error', err.message);
    }
  };

  const handleCheckIn = async () => {
    clearError();

    if (!location) {
      useAlertStore.getState().showAlert('Location Required', 'Please wait for GPS to get your location.');
      return;
    }

    if (!selfiePath) {
      useAlertStore.getState().showAlert('Selfie Required', 'Please capture a selfie before checking in.');
      return;
    }

    if (geofenceStatus && !geofenceStatus.isInsideAny) {
      if (geofenceStatus.nearestZone) {
        useAlertStore.getState().showAlert(
          '⚠️ Outside Allowed Area',
          `You are ${formatDistance(geofenceStatus.nearestZone.distanceToBoundary)} away from "${geofenceStatus.nearestZone.zone.name}".`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Check In Anyway', onPress: () => performCheckIn(true) },
          ]
        );
      } else {
        useAlertStore.getState().showAlert(
          '⚠️ No Geofence Zones Configured',
          'Please configure geofence zones in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Check In Anyway', onPress: () => performCheckIn(true) },
          ]
        );
      }
      return;
    }

    performCheckIn(false);
  };

  const getSelectedZoneName = () => {
    if (geofenceStatus?.matchedZone) return geofenceStatus.matchedZone.name;
    if (selectedZoneId !== 'auto') {
      const z = zones.find(x => x.id === selectedZoneId);
      if (z) return z.name;
    }
    if (geofenceStatus?.nearestZone?.zone?.name) return geofenceStatus.nearestZone.zone.name;
    return 'Unknown Zone';
  };

  const performCheckIn = async (skipGeofence) => {
    const currentZone = getSelectedZoneName();
    const result = await checkIn(user.id, { selfiePath, skipGeofence, zoneName: currentZone });
    if (result.success) {
      useAlertStore.getState().showAlert('✅ Checked In!', 'Your attendance has been recorded.');
      setSelfiePath(null);
      setSelfieUri(null);
    }
  };

  const handleCheckOut = async () => {
    clearError();
    useAlertStore.getState().showAlert(
      'Confirm Check-Out',
      'Are you sure you want to check out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          onPress: async () => {
            const currentZone = getSelectedZoneName();
            const isInside = geofenceStatus?.isInsideAny ?? true;
            const result = await checkOut(user.id, currentZone, isInside);
            if (result.success) {
              const greeting = getISTGreeting().toLowerCase();
              useAlertStore.getState().showAlert('✅ Checked Out!', `Have a great ${greeting}!`);
            }
          },
        },
      ]
    );
  };

  const isCheckedIn = todayStatus?.status === 'checked_in';
  const canCheckIn = !isCheckedIn && !locationLoading;
  const isInsideGeofence = geofenceStatus?.isInsideAny;
  const todaySessions = todayStatus?.todaySessions || [];

  return (
    <ScreenWrapper scrollable={false}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Sticky Header */}
        <View style={[styles.header, { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={Spacing.hitSlop}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance</Text>
          <TouchableOpacity onPress={() => { setLocationLoading(true); fetchLocationAndZones(); }} hitSlop={Spacing.hitSlop}>
            <Icon name="refresh" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
          showsVerticalScrollIndicator={false}
        >

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="map-marker" size={20} color={Colors.accent} />
            <Text style={styles.cardTitle}>Your Location</Text>
          </View>
          {locationLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Getting GPS location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity onPress={fetchLocationAndZones}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.placeText}>
                {placeName || 'Resolving place name...'}
              </Text>
              <Text style={styles.coordTextSmall}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              <Text style={styles.accuracyText}>Accuracy: ±{Math.round(location.accuracy || 0)}m</Text>
            </View>
          )}
        </View>

        {/* Map Card */}
        {!locationLoading && location && (
          <View style={styles.mapCard}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              customMapStyle={mapDarkStyle}
              showsUserLocation={false}
              showsMyLocationButton={false}
              zoomEnabled={false}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              onPress={() => setIsMapModalVisible(true)}
            >
              {/* Current location marker */}
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Your Location"
                description="Where you are currently marking attendance"
              >
                <View style={styles.userMarkerContainer}>
                  <View style={styles.userMarkerDot} />
                  <View style={styles.userMarkerPulse} />
                </View>
              </Marker>

              {/* Geofence Circles & Office Markers */}
              {zones.filter(z => z.isActive && (selectedZoneId === 'auto' || selectedZoneId === z.id)).map((zone) => {
                const isCurrentMatched = geofenceStatus?.matchedZone?.id === zone.id;
                const strokeColor = isCurrentMatched ? Colors.success : Colors.primary;
                const fillColor = isCurrentMatched ? Colors.successGlow : Colors.primaryGlow;

                return (
                  <React.Fragment key={zone.id}>
                    <Circle
                      center={{
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                      }}
                      radius={zone.radiusMeters}
                      strokeWidth={2}
                      strokeColor={strokeColor}
                      fillColor={fillColor}
                    />
                    <Marker
                      coordinate={{
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                      }}
                      title={zone.name}
                      description={`Allowed radius: ${zone.radiusMeters}m`}
                    >
                      <Icon name="office-building" size={24} color={isCurrentMatched ? Colors.success : Colors.textMuted} />
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapView>
            <TouchableOpacity 
              style={styles.expandMapIcon}
              onPress={() => setIsMapModalVisible(true)}
              hitSlop={Spacing.hitSlop}
            >
              <Icon name="fullscreen" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Zone Picker */}
        {geofenceStatus && (
          <View style={styles.pickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
              <TouchableOpacity
                style={[styles.chip, selectedZoneId === 'auto' && styles.chipActive]}
                onPress={() => setSelectedZoneId('auto')}
              >
                <Icon name="crosshairs-gps" size={16} color={selectedZoneId === 'auto' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.chipText, selectedZoneId === 'auto' && styles.chipTextActive]}>Auto (Nearest)</Text>
              </TouchableOpacity>

              {zones.filter(z => z.isActive).map(zone => (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.chip, selectedZoneId === zone.id && styles.chipActive, { maxWidth: scale(200) }]}
                  onPress={() => setSelectedZoneId(zone.id)}
                >
                  <Icon name="map-marker-radius" size={16} color={selectedZoneId === zone.id ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.chipText, selectedZoneId === zone.id && styles.chipTextActive]} numberOfLines={1} ellipsizeMode="tail">
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Geofence Status */}
        <View style={[styles.card, {
          borderColor: geofenceStatus
            ? (isInsideGeofence ? Colors.success + '40' : Colors.error + '40')
            : Colors.border,
          backgroundColor: geofenceStatus
            ? (isInsideGeofence ? 'rgba(0,230,118,0.05)' : 'rgba(255,82,82,0.05)')
            : Colors.surface,
        }]}>
          <View style={styles.cardHeader}>
            <Icon
              name={isInsideGeofence ? 'shield-check' : 'shield-alert'}
              size={20}
              color={isInsideGeofence ? Colors.success : (geofenceStatus ? Colors.error : Colors.textMuted)}
            />
            <Text style={styles.cardTitle}>Geofence Status</Text>
          </View>
          {geofenceStatus ? (
            <View>
              {isInsideGeofence ? (
                <View style={styles.geofenceRow}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                  <Text style={[styles.geofenceText, { color: Colors.success }]}>
                    Inside: {geofenceStatus.matchedZone?.name}
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: Colors.error }]}>Outside Allowed Area</Text>
                  {geofenceStatus.nearestZone ? (
                    <Text style={styles.geofenceDetail} numberOfLines={2}>
                      Nearest: {geofenceStatus.nearestZone.zone.name}{'\n'}
                      ({formatDistance(geofenceStatus.nearestZone.distanceToBoundary)} away)
                    </Text>
                  ) : (
                    <Text style={styles.geofenceDetail} numberOfLines={2}>
                      No geofence zones are currently configured.
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: Spacing.sm }} />
              <Text style={[styles.geofenceDetail, { marginTop: 0 }]}>Checking geofence zones...</Text>
            </View>
          )}
        </View>

        {/* Selfie Section */}
        {canCheckIn && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="camera" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Selfie Verification</Text>
            </View>
            {selfieUri ? (
              <View style={styles.selfiePreview}>
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
                <View style={styles.selfieActions}>
                  <TouchableOpacity style={styles.retakeButton} onPress={handleCaptureSelfie}>
                    <Icon name="camera-retake" size={16} color={Colors.textPrimary} />
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                  <View style={styles.selfieBadge}>
                    <Icon name="check-circle" size={14} color={Colors.success} />
                    <Text style={styles.selfieBadgeText}>Captured</Text>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={handleCaptureSelfie}>
                <View style={styles.captureIcon}>
                  <Icon name="camera-plus" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.captureText}>Tap to capture selfie</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Today's Sessions */}
        {todaySessions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="clipboard-text" size={20} color={Colors.accent} />
              <Text style={styles.cardTitle}>Today's Sessions ({todaySessions.length})</Text>
            </View>
            {todaySessions.map((session, index) => {
              const duration = calculateDuration(session.checkInTime, session.checkOutTime);
              const isActive = session.status === 'checked_in';
              return (
                <View key={session.id} style={[
                  styles.sessionRow,
                  index < todaySessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.divider },
                ]}>
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionTimeRow}>
                      <Text style={styles.sessionLabel}>#{index + 1}</Text>
                      <Text style={styles.recordValue}>
                        {formatTime(session.checkInTime)}
                        {session.checkOutTime ? ` — ${formatTime(session.checkOutTime)}` : ' — ...'}
                      </Text>
                    </View>
                    <View style={styles.sessionLocations}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.sessionLocationText, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                          In: {session.geofenceZone || 'Unknown'}
                        </Text>
                        <Text style={[styles.sessionLocationText, { flexShrink: 0, color: session.isWithinGeofence ? Colors.success : Colors.error, marginLeft: 4 }]}>
                          ({session.isWithinGeofence ? 'Inside' : 'Outside'})
                        </Text>
                      </View>
                      {session.checkOutTime ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.sessionLocationText, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                            Out: {session.checkOutGeofenceZone || session.geofenceZone || 'Unknown'}
                          </Text>
                          <Text style={[styles.sessionLocationText, { flexShrink: 0, color: session.isCheckOutWithinGeofence !== 0 ? Colors.success : Colors.error, marginLeft: 4 }]}>
                            ({session.isCheckOutWithinGeofence !== 0 ? 'Inside' : 'Outside'})
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.sessionLocationText, { color: Colors.success }]}>In Progress</Text>
                      )}
                    </View>
                    <Text style={[styles.sessionDuration, isActive && { color: Colors.success }]}>
                      {isActive ? (
                        <Text>Active: <LiveTimer startTime={todayStatus?.activeSession?.checkInTime} /></Text>
                      ) : (
                        duration.formatted
                      )}
                    </Text>
                  </View>
                  <View style={[
                    styles.sessionDot,
                    { backgroundColor: isActive ? Colors.success : Colors.accent },
                  ]} />
                </View>
              );
            })}
            {/* Total hours row */}
            {todaySessions.some(s => s.status !== 'checked_in') && (
              <View style={styles.totalHoursRow}>
                <Text style={styles.totalHoursLabel}>Total Completed</Text>
                <Text style={styles.totalHoursValue}>{todayStatus?.totalHoursToday || '0.0'}h</Text>
              </View>
            )}
          </View>
        )}

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Main Action Button */}
        <View style={styles.actionSection}>
          {isCheckedIn ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.mainButton, styles.checkOutButton, (locationLoading || !geofenceStatus) && styles.buttonDisabled]}
                onPress={handleCheckOut}
                disabled={isCheckingOut || locationLoading || !geofenceStatus}
                activeOpacity={0.8}
              >
                {isCheckingOut ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Icon name="location-exit" size={24} color={Colors.white} />
                    <Text style={styles.mainButtonText}>Check Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[styles.mainButton, styles.checkInButton, (!canCheckIn || !selfiePath || !geofenceStatus) && styles.buttonDisabled]}
              onPress={handleCheckIn}
              disabled={!canCheckIn || !selfiePath || isCheckingIn || !geofenceStatus}
              activeOpacity={0.8}
            >
              {isCheckingIn ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Icon name="login" size={24} color={Colors.white} />
                  <Text style={styles.mainButtonText}>Check In</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        </ScrollView>
      </Animated.View>

      <CustomCameraModal
        visible={isCameraModalVisible}
        onClose={() => setIsCameraModalVisible(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />

      {/* Full Screen Map Modal */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        onRequestClose={() => setIsMapModalVisible(false)}
      >
    <ScreenWrapper scrollable={false}>
          {/* Sticky Header */}
          <View style={[styles.fullScreenMapHeader, { paddingTop: Spacing.sm }]}>
            <TouchableOpacity onPress={() => setIsMapModalVisible(false)} hitSlop={Spacing.hitSlop}>
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.fullScreenMapTitle}>Live GPS Coverage</Text>
            <View style={{ width: 24 }} />
          </View>

          {location && (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
              customMapStyle={mapDarkStyle}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {/* Current location marker */}
              <Marker
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                title="Your Location"
              >
                <View style={styles.userMarkerContainer}>
                  <View style={styles.userMarkerDot} />
                  <View style={styles.userMarkerPulse} />
                </View>
              </Marker>

              {/* All Zones */}
              {zones.filter(z => z.isActive).map((zone) => {
                const isCurrentMatched = geofenceStatus?.matchedZone?.id === zone.id;
                const strokeColor = isCurrentMatched ? Colors.success : Colors.primary;
                const fillColor = isCurrentMatched ? Colors.successGlow : Colors.primaryGlow;

                return (
                  <React.Fragment key={`full-${zone.id}`}>
                    <Circle
                      center={{ latitude: zone.latitude, longitude: zone.longitude }}
                      radius={zone.radiusMeters}
                      strokeWidth={2}
                      strokeColor={strokeColor}
                      fillColor={fillColor}
                    />
                    <Marker
                      coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                      title={zone.name}
                      description={`Radius: ${zone.radiusMeters}m`}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon name="office-building" size={24} color={isCurrentMatched ? Colors.success : Colors.textMuted} />
                        <View style={styles.mapLabelBox}>
                          <Text style={styles.mapLabelText}>{zone.name}</Text>
                        </View>
                      </View>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapView>
          )}
        </ScreenWrapper>
      </Modal>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: 0, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },

  pickerContainer: {
    marginBottom: Spacing.md,
  },
  pickerScroll: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: moderateScale(13),
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  chipTextActive: {
    color: Colors.white,
  },

  card: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    padding: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontFamily: Fonts.semiBold, fontSize: moderateScale(14), color: Colors.textPrimary, marginLeft: Spacing.sm },

  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { fontFamily: Fonts.regular, color: Colors.textSecondary, marginLeft: Spacing.sm, fontSize: moderateScale(13) },
  errorRow: { flexDirection: 'row', alignItems: 'center' },
  errorText: { fontFamily: Fonts.regular, color: Colors.error, marginLeft: Spacing.sm, flex: 1, fontSize: moderateScale(13) },
  retryText: { fontFamily: Fonts.semiBold, color: Colors.primary, marginLeft: Spacing.sm, fontSize: moderateScale(13) },
  placeText: { fontFamily: Fonts.medium, fontSize: moderateScale(14), color: Colors.textPrimary },
  coordTextSmall: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  accuracyText: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textMuted, marginTop: 2 },

  geofenceRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: scale(8), height: verticalScale(8), borderRadius: moderateScale(4), marginRight: Spacing.sm },
  geofenceText: { fontFamily: Fonts.semiBold, fontSize: moderateScale(14) },
  geofenceDetail: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textSecondary, marginTop: 4, marginLeft: 16 },

  selfiePreview: { alignItems: 'center' },
  selfieImage: { width: scale(160), height: scale(160), borderRadius: Spacing.radius.md, marginBottom: Spacing.md },
  selfieActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  retakeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.surfaceLight, borderRadius: moderateScale(20) },
  retakeText: { fontFamily: Fonts.medium, color: Colors.textPrimary, fontSize: moderateScale(12), marginLeft: 4 },
  selfieBadge: { flexDirection: 'row', alignItems: 'center' },
  selfieBadgeText: { fontFamily: Fonts.medium, color: Colors.success, fontSize: moderateScale(12), marginLeft: 4 },
  captureButton: { alignItems: 'center', paddingVertical: Spacing.lg },
  captureIcon: {
    width: scale(64), height: verticalScale(64), borderRadius: moderateScale(32),
    backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  captureText: { fontFamily: Fonts.regular, fontSize: moderateScale(13), color: Colors.textSecondary },

  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  recordLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(13), color: Colors.textSecondary },
  recordValue: { fontFamily: Fonts.semiBold, fontSize: moderateScale(13), color: Colors.textPrimary },

  timerContainer: { alignItems: 'center', marginTop: Spacing.base, paddingTop: Spacing.md },
  timerLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textSecondary },
  timerValue: { fontFamily: Fonts.bold, fontSize: moderateScale(28), color: Colors.success, marginTop: 4, fontVariant: ['tabular-nums'] },

  sessionLocations: { flexDirection: 'column', gap: 4, marginTop: 4 },
  sessionLocationText: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textSecondary, flexShrink: 1 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.errorGlow, borderRadius: Spacing.radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
  },
  errorBannerText: { fontFamily: Fonts.regular, color: Colors.error, fontSize: moderateScale(13), marginLeft: Spacing.sm, flex: 1 },

  actionSection: { marginTop: Spacing.md },
  mainButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: Spacing.radius.lg, height: verticalScale(56),
  },
  checkInButton: { backgroundColor: Colors.success, ...Spacing.shadows.glowSuccess },
  checkOutButton: { backgroundColor: Colors.error, ...Spacing.shadows.glowDanger },
  buttonDisabled: { opacity: 0.4 },
  mainButtonText: { fontFamily: Fonts.bold, color: Colors.white, fontSize: moderateScale(18), marginLeft: Spacing.sm },

  // Session list styles
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  sessionInfo: { flex: 1 },
  sessionTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionLabel: { fontFamily: Fonts.bold, fontSize: moderateScale(12), color: Colors.textMuted, width: scale(22) },
  sessionDuration: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textSecondary, marginTop: 2 },
  sessionDot: { width: scale(8), height: verticalScale(8), borderRadius: moderateScale(4), marginLeft: Spacing.sm },
  totalHoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, marginTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  totalHoursLabel: { fontFamily: Fonts.semiBold, fontSize: moderateScale(14), color: Colors.textSecondary },
  totalHoursValue: { fontFamily: Fonts.bold, fontSize: moderateScale(16), color: Colors.accent },
  mapCard: {
    height: verticalScale(220),
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarkerContainer: {
    width: scale(24),
    height: verticalScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: {
    width: scale(12),
    height: verticalScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: scale(24),
    height: verticalScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: Colors.accentGlow,
    zIndex: 1,
  },
  expandMapIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  fullScreenMapContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullScreenMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding.horizontal,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  fullScreenMapTitle: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(16),
    color: Colors.textPrimary,
  },
  mapLabelBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  mapLabelText: {
    color: Colors.white,
    fontSize: moderateScale(10),
    fontFamily: Fonts.medium,
  },
});

export default CheckInScreen;
