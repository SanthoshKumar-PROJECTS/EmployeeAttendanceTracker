/**
 * Settings Screen
 * Geofence management, notification preferences, and app settings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import GeofenceService from '../services/GeofenceService';
import NotificationService from '../services/NotificationService';
import LocationService from '../services/LocationService';
import { formatDistance } from '../utils/geofencing';
import uuid from 'react-native-uuid';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import ScreenWrapper from '../components/ScreenWrapper';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

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

const SettingsScreen = ({ navigation }) => {
  const [zones, setZones] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneLat, setNewZoneLat] = useState('');
  const [newZoneLng, setNewZoneLng] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState('200');

  useEffect(() => {
    loadZones();
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      const pos = await LocationService.getCurrentPosition();
      setCurrentLocation(pos);
    } catch (err) {
      console.log('Failed to fetch location in settings:', err);
    }
  };

  const loadZones = async () => {
    const allZones = await GeofenceService.getAllZones();
    setZones(allZones);
  };

  const handleToggleZone = async (zoneId) => {
    await GeofenceService.toggleZone(zoneId);
    loadZones();
  };

  const handleDeleteZone = (zone) => {
    Alert.alert(
      'Delete Zone',
      `Are you sure you want to delete "${zone.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await GeofenceService.deleteZone(zone.id);
            loadZones();
          },
        },
      ]
    );
  };

  const handleAddZone = async () => {
    if (!newZoneName.trim() || !newZoneLat || !newZoneLng) {
      Alert.alert('Error', 'Name, latitude, and longitude are required');
      return;
    }

    const lat = parseFloat(newZoneLat);
    const lng = parseFloat(newZoneLng);
    const radius = parseInt(newZoneRadius, 10) || 200;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Enter valid coordinates');
      return;
    }

    await GeofenceService.addZone({
      id: `zone_${uuid.v4().substring(0, 8)}`,
      name: newZoneName.trim(),
      latitude: lat,
      longitude: lng,
      radiusMeters: radius,
    });

    setShowAddZone(false);
    setNewZoneName('');
    setNewZoneLat('');
    setNewZoneLng('');
    setNewZoneRadius('200');
    loadZones();
    Alert.alert('Success', 'Geofence zone added');
  };

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    if (value) {
      await NotificationService.scheduleCheckInReminder();
      await NotificationService.scheduleCheckOutReminder();
    } else {
      await NotificationService.cancelAllScheduled();
    }
  };

  return (
    <ScreenWrapper scrollable={true} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={Spacing.hitSlop}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: scale(24) }} />
        </View>

        {/* Geofence Zones Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Geofence Zones</Text>
          <TouchableOpacity onPress={() => setShowAddZone(!showAddZone)}>
            <Icon name={showAddZone ? 'close' : 'plus-circle'} size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Add Zone Form */}
        {showAddZone && (
          <View style={styles.addZoneCard}>
            <TextInput
              style={styles.zoneInput}
              placeholder="Zone Name (e.g., Main Office)"
              placeholderTextColor={Colors.textMuted}
              value={newZoneName}
              onChangeText={setNewZoneName}
            />
            {/* Mini Map Tap-to-Locate */}
            <View style={styles.miniMapContainer}>
              <Text style={styles.miniMapHelp}>Tap map to set Lat/Lng, drag marker to adjust</Text>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                initialRegion={{
                  latitude: currentLocation?.latitude || 12.9716,
                  longitude: currentLocation?.longitude || 77.5946,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                customMapStyle={mapDarkStyle}
                onPress={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setNewZoneLat(latitude.toFixed(6).toString());
                  setNewZoneLng(longitude.toFixed(6).toString());
                }}
              >
                {/* User Location Marker */}
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="Your Location"
                  >
                    <Icon name="account" size={24} color={Colors.accent} />
                  </Marker>
                )}

                {/* Selected Point Marker */}
                {newZoneLat && newZoneLng && !isNaN(parseFloat(newZoneLat)) && !isNaN(parseFloat(newZoneLng)) && (
                  <Marker
                    coordinate={{
                      latitude: parseFloat(newZoneLat),
                      longitude: parseFloat(newZoneLng),
                    }}
                    title="New Zone Center"
                    draggable
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setNewZoneLat(latitude.toFixed(6).toString());
                      setNewZoneLng(longitude.toFixed(6).toString());
                    }}
                  />
                )}
              </MapView>
            </View>
            <View style={styles.coordRow}>
              <TextInput
                style={[styles.zoneInput, styles.coordInput]}
                placeholder="Latitude"
                placeholderTextColor={Colors.textMuted}
                value={newZoneLat}
                onChangeText={setNewZoneLat}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.zoneInput, styles.coordInput]}
                placeholder="Longitude"
                placeholderTextColor={Colors.textMuted}
                value={newZoneLng}
                onChangeText={setNewZoneLng}
                keyboardType="decimal-pad"
              />
            </View>
            <TextInput
              style={styles.zoneInput}
              placeholder="Radius in meters (default: 200)"
              placeholderTextColor={Colors.textMuted}
              value={newZoneRadius}
              onChangeText={setNewZoneRadius}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
              <Icon name="map-marker-plus" size={18} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Zone</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Zone List */}
        <View style={styles.section}>
          {zones.length === 0 ? (
            <View style={styles.emptyZone}>
              <Icon name="map-marker-off" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyZoneText}>No geofence zones configured</Text>
            </View>
          ) : (
            zones.map((zone) => (
              <View key={zone.id} style={styles.zoneItem}>
                <View style={styles.zoneInfo}>
                  <View style={styles.zoneNameRow}>
                    <Icon
                      name="map-marker-radius"
                      size={18}
                      color={zone.isActive ? Colors.success : Colors.textMuted}
                    />
                    <Text style={[styles.zoneName, !zone.isActive && styles.zoneInactive]}>
                      {zone.name}
                    </Text>
                  </View>
                  <Text style={styles.zoneCoords}>
                    {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} • {zone.radiusMeters}m radius
                  </Text>
                </View>
                <View style={styles.zoneActions}>
                  <Switch
                    value={!!zone.isActive}
                    onValueChange={() => handleToggleZone(zone.id)}
                    trackColor={{ false: Colors.surfaceLight, true: Colors.success + '50' }}
                    thumbColor={zone.isActive ? Colors.success : Colors.textMuted}
                  />
                  <TouchableOpacity
                    onPress={() => handleDeleteZone(zone)}
                    hitSlop={Spacing.hitSlop}
                    style={styles.deleteButton}
                  >
                    <Icon name="delete-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitleStandalone}>Notifications</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.warningGlow }]}>
                <Icon name="bell-ring" size={18} color={Colors.warning} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Daily Reminders</Text>
                <Text style={styles.settingDesc}>Check-in (9 AM) & Check-out (6 PM)</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary + '50' }}
              thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitleStandalone}>About</Text>
        <View style={styles.section}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Storage Mode</Text>
            <Text style={styles.aboutValue}>Local (SQLite + Secure Storage)</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Push Notifications</Text>
            <Text style={styles.aboutValue}>Firebase Cloud Messaging</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Authentication</Text>
            <Text style={styles.aboutValue}>Local + Biometric</Text>
          </View>
        </View>

        <View style={{ height: verticalScale(40) }} />
      </ScreenWrapper>
    );
  };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding.horizontal,
    paddingTop: Spacing.xl, paddingBottom: 100,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(13), color: Colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  sectionTitleStandalone: {
    fontFamily: Fonts.semiBold,
    fontSize: moderateScale(13), color: Colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm, marginLeft: 4,
  },

  section: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },

  // Add Zone
  addZoneCard: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.lg,
    padding: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  zoneInput: {
    fontFamily: Fonts.regular,
    backgroundColor: Colors.surfaceLight, borderRadius: Spacing.radius.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: moderateScale(14), marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  coordRow: { flexDirection: 'row', gap: 8 },
  coordInput: { flex: 1 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Spacing.radius.sm,
    paddingVertical: Spacing.md, marginTop: Spacing.xs,
  },
  addButtonText: { fontFamily: Fonts.semiBold, color: Colors.white, fontSize: moderateScale(14), marginLeft: 6 },

  // Zone List
  zoneItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  zoneInfo: { flex: 1 },
  zoneNameRow: { flexDirection: 'row', alignItems: 'center' },
  zoneName: { fontFamily: Fonts.medium, fontSize: moderateScale(15), color: Colors.textPrimary, marginLeft: 6 },
  zoneInactive: { color: Colors.textMuted },
  zoneCoords: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textMuted, marginTop: 2, marginLeft: 24 },
  zoneActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteButton: { padding: 4 },

  emptyZone: { alignItems: 'center', padding: Spacing.xl },
  emptyZoneText: { fontFamily: Fonts.regular, color: Colors.textMuted, fontSize: moderateScale(13), marginTop: Spacing.sm },

  // Settings
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: {
    width: scale(36), height: verticalScale(36), borderRadius: moderateScale(18), justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: { fontFamily: Fonts.medium, fontSize: moderateScale(15), color: Colors.textPrimary },
  settingDesc: { fontFamily: Fonts.regular, fontSize: moderateScale(12), color: Colors.textMuted, marginTop: 2 },

  // About
  aboutItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  aboutLabel: { fontFamily: Fonts.regular, fontSize: moderateScale(14), color: Colors.textSecondary },
  aboutValue: { fontFamily: Fonts.medium, fontSize: moderateScale(13), color: Colors.textPrimary },
  miniMapContainer: {
    height: verticalScale(160),
    borderRadius: Spacing.radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMapHelp: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: 'rgba(18, 18, 28, 0.85)',
    color: Colors.textSecondary,
    fontSize: moderateScale(10),
    fontFamily: Fonts.medium,
    textAlign: 'center',
    paddingVertical: 3,
    borderRadius: moderateScale(4),
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
});

export default SettingsScreen;
