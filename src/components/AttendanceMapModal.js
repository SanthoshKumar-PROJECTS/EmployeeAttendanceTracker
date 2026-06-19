/**
 * Attendance Map Modal
 * Renders check-in and check-out coordinates on a map overlay for historical verification.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import { formatTime, formatDate } from '../utils/dateUtils';
import LocationService from '../services/LocationService';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export const AttendanceMapModal = ({ isVisible, onClose, record }) => {
  const [checkInPlace, setCheckInPlace] = useState('');
  const [checkOutPlace, setCheckOutPlace] = useState('');

  useEffect(() => {
    if (!isVisible || !record) return;
    
    setCheckInPlace('');
    setCheckOutPlace('');

    const fetchNames = async () => {
      try {
        const inPlace = await LocationService.getPlaceName(record.checkInLat, record.checkInLng);
        setCheckInPlace(inPlace);
      } catch (err) {
        setCheckInPlace('Location Name Unavailable');
      }

      if (record.checkOutLat && record.checkOutLng) {
        try {
          const outPlace = await LocationService.getPlaceName(record.checkOutLat, record.checkOutLng);
          setCheckOutPlace(outPlace);
        } catch (err) {
          setCheckOutPlace('Location Name Unavailable');
        }
      }
    };

    fetchNames();
  }, [isVisible, record]);

  if (!record || !record.checkInLat || !record.checkInLng) return null;

  const showCheckOut = record.checkOutLat && record.checkOutLng;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{formatDate(record.date)}</Text>
              <Text style={styles.subtitle}>GPS Verification Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Map View */}
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: record.checkInLat,
                longitude: record.checkInLng,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
              customMapStyle={mapDarkStyle}
            >
              {/* Check-In Marker */}
              <Marker
                coordinate={{
                  latitude: record.checkInLat,
                  longitude: record.checkInLng,
                }}
                title="Check-In"
                description={`Time: ${formatTime(record.checkInTime)}`}
              >
                <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
                  <Icon name="login" size={16} color={Colors.white} />
                </View>
              </Marker>

              {/* Check-Out Marker */}
              {showCheckOut && (
                <Marker
                  coordinate={{
                    latitude: record.checkOutLat,
                    longitude: record.checkOutLng,
                  }}
                  title="Check-Out"
                  description={`Time: ${formatTime(record.checkOutTime)}`}
                >
                  <View style={[styles.markerPin, { backgroundColor: Colors.error }]}>
                    <Icon name="logout" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}

              {/* Geofence Overlay Circle (Estimated) */}
              {record.geofenceZone && (
                <Circle
                  center={{
                    latitude: record.checkInLat, // Centered around checkin for estimated visual
                    longitude: record.checkInLng,
                  }}
                  radius={200} // standard default radius
                  strokeWidth={1.5}
                  strokeColor={record.isWithinGeofence ? Colors.success : Colors.warning}
                  fillColor={record.isWithinGeofence ? Colors.successGlow : Colors.warningGlow}
                />
              )}
            </MapView>
          </View>

          {/* Location Details Footer */}
          <View style={styles.footer}>
            <View style={styles.detailRow}>
              <Icon name="shield-check" size={18} color={record.isWithinGeofence ? Colors.success : Colors.warning} />
              <Text style={styles.detailText}>
                Geofence: <Text style={styles.detailHighlight}>{record.isWithinGeofence ? `Inside "${record.geofenceZone || 'Office'}"` : 'Outside Allowed Area'}</Text>
              </Text>
            </View>

            <View style={styles.coordsBlock}>
              <View style={styles.coordCol}>
                <Text style={styles.coordLabel}>Check-In Location</Text>
                <Text style={styles.placeVal}>{checkInPlace || 'Resolving place name...'}</Text>
                <Text style={styles.coordValSmall}>{record.checkInLat.toFixed(6)}, {record.checkInLng.toFixed(6)}</Text>
              </View>
              {showCheckOut && (
                <View style={styles.dividerLine} />
              )}
              {showCheckOut && (
                <View style={styles.coordCol}>
                  <Text style={styles.coordLabel}>Check-Out Location</Text>
                  <Text style={styles.placeVal}>{checkOutPlace || 'Resolving place name...'}</Text>
                  <Text style={styles.coordValSmall}>{record.checkOutLat.toFixed(6)}, {record.checkOutLng.toFixed(6)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 14, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radius.xl,
    borderTopRightRadius: Spacing.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: Spacing.base,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: scale(36),
    height: verticalScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.45,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPin: {
    width: scale(30),
    height: verticalScale(30),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  footer: {
    padding: Spacing.base,
    paddingBottom: 32, // extra padding for bottom safe area
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  detailHighlight: {
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
  },
  coordsBlock: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  coordCol: {
    width: '100%',
  },
  coordLabel: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  placeVal: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
  },
  coordValSmall: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
    width: '100%',
  },
});

export default AttendanceMapModal;
