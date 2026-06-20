import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../components/ScreenWrapper';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import { formatTime, formatDate } from '../utils/dateUtils';
import LocationService from '../services/LocationService';
import { haversineDistance } from '../utils/geofencing';
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

const AttendanceDetailsScreen = ({ route, navigation }) => {
  const { record } = route.params;

  const [checkInPlace, setCheckInPlace] = useState('');
  const [checkOutPlace, setCheckOutPlace] = useState('');
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  const mapRef = useRef(null);
  const fullMapRef = useRef(null);

  useEffect(() => {
    if (!record) return;

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
  }, [record]);

  const showCheckOut = !!(record?.checkOutLat && record?.checkOutLng);
  const checkInInside = record?.isWithinGeofence !== 0;
  const checkOutInside = record?.isCheckOutWithinGeofence !== 0;

  const handleMapReady = React.useCallback((ref) => {
    if (showCheckOut && ref && record) {
      const distance = haversineDistance(
        record.checkInLat, record.checkInLng,
        record.checkOutLat, record.checkOutLng
      );

      if (distance > 1000) {
        ref.fitToCoordinates(
          [
            { latitude: record.checkInLat, longitude: record.checkInLng },
            { latitude: record.checkOutLat, longitude: record.checkOutLng },
          ],
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    }
  }, [record, showCheckOut]);

  const memoizedMapView = React.useMemo(() => {
    if (!record) return null;
    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: record.checkInLat,
          longitude: record.checkInLng,
          latitudeDelta: showCheckOut ? 0.05 : 0.012,
          longitudeDelta: showCheckOut ? 0.05 : 0.012,
        }}
        customMapStyle={mapDarkStyle}
        onMapReady={() => handleMapReady(mapRef.current)}
        onPress={() => setIsMapModalVisible(true)}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{ latitude: record.checkInLat, longitude: record.checkInLng }}
          title="Check-In"
        >
          <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
            <Icon name="login" size={16} color={Colors.white} />
          </View>
        </Marker>

        {showCheckOut && (
          <Marker
            coordinate={{ latitude: record.checkOutLat, longitude: record.checkOutLng }}
            title="Check-Out"
          >
            <View style={[styles.markerPin, { backgroundColor: Colors.error }]}>
              <Icon name="logout" size={16} color={Colors.white} />
            </View>
          </Marker>
        )}

        <Circle
          center={{ latitude: record.checkInLat, longitude: record.checkInLng }}
          radius={200}
          strokeWidth={1.5}
          strokeColor={checkInInside ? Colors.success : Colors.warning}
          fillColor={checkInInside ? Colors.successGlow : Colors.warningGlow}
        />
        
        {showCheckOut && (
          <Circle
            center={{ latitude: record.checkOutLat, longitude: record.checkOutLng }}
            radius={200}
            strokeWidth={1.5}
            strokeColor={checkOutInside ? Colors.error : Colors.warning}
            fillColor={checkOutInside ? Colors.errorGlow : Colors.warningGlow}
          />
        )}
      </MapView>
    );
  }, [record, showCheckOut, checkInInside, checkOutInside, handleMapReady]);

  if (!record) return null;

  return (
    <ScreenWrapper scrollable={false}>
      {/* Sticky Header */}
      <View style={[styles.header, { paddingHorizontal: Spacing.screenPadding.horizontal, paddingTop: Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={Spacing.hitSlop}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
        
        {/* Basic Session Info */}
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Icon name="calendar" size={18} color={Colors.primary} />
            <Text style={styles.dateText}>{formatDate(record.date)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeVal}>{formatTime(record.checkInTime)}</Text>
            <Icon name="arrow-right" size={16} color={Colors.textMuted} style={{ marginHorizontal: Spacing.sm }} />
            <Text style={styles.timeVal}>{record.checkOutTime ? formatTime(record.checkOutTime) : 'In Progress'}</Text>
          </View>
        </View>

        {/* Selfie Display */}
        {!!record.selfiePath && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Verification Photo</Text>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.selfieContainer}
              onPress={() => setIsPhotoModalVisible(true)}
            >
              <Image 
                source={{ uri: record.selfiePath.startsWith('file://') || record.selfiePath.startsWith('http') ? record.selfiePath : `file://${record.selfiePath}` }} 
                style={styles.selfieImage} 
              />
              <View style={styles.expandIconContainer}>
                <Icon name="fullscreen" size={24} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Map View */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>GPS Verification</Text>
          <View style={styles.mapContainer}>
            {memoizedMapView}
            <TouchableOpacity 
              style={styles.expandIconContainer}
              onPress={() => setIsMapModalVisible(true)}
              hitSlop={Spacing.hitSlop}
            >
              <Icon name="fullscreen" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Breakdown Panel */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location Status Breakdown</Text>
          
          <View style={styles.statusBlock}>
            <View style={styles.statusHeader}>
              <View style={[styles.dot, { backgroundColor: Colors.success }]} />
              <Text style={styles.statusTitle}>Check-In Location</Text>
            </View>
            <Text style={styles.placeVal}>{checkInPlace || 'Resolving place name...'}</Text>
            <Text style={styles.coordValSmall}>{record.checkInLat.toFixed(6)}, {record.checkInLng.toFixed(6)}</Text>
            
            <View style={styles.geofenceRow}>
              <Icon name={checkInInside ? "shield-check" : "alert"} size={16} color={checkInInside ? Colors.success : Colors.error} style={{ marginTop: 2 }} />
              <Text style={styles.geofenceText}>
                Zone: <Text style={{ fontFamily: Fonts.bold, color: Colors.textPrimary }}>{record.geofenceZone || 'Unknown'}</Text>
                {' '}
                <Text style={{ color: checkInInside ? Colors.success : Colors.error }}>
                  ({checkInInside ? 'Inside' : 'Outside'})
                </Text>
              </Text>
            </View>
          </View>

          {showCheckOut && (
            <>
              <View style={styles.divider} />
              <View style={styles.statusBlock}>
                <View style={styles.statusHeader}>
                  <View style={[styles.dot, { backgroundColor: Colors.error }]} />
                  <Text style={styles.statusTitle}>Check-Out Location</Text>
                </View>
                <Text style={styles.placeVal}>{checkOutPlace || 'Resolving place name...'}</Text>
                <Text style={styles.coordValSmall}>{record.checkOutLat.toFixed(6)}, {record.checkOutLng.toFixed(6)}</Text>
                
                <View style={styles.geofenceRow}>
                  <Icon name={checkOutInside ? "shield-check" : "alert"} size={16} color={checkOutInside ? Colors.success : Colors.error} style={{ marginTop: 2 }} />
                  <Text style={styles.geofenceText}>
                    Zone: <Text style={{ fontFamily: Fonts.bold, color: Colors.textPrimary }}>{record.checkOutGeofenceZone || record.geofenceZone || 'Unknown'}</Text>
                    {' '}
                    <Text style={{ color: checkOutInside ? Colors.success : Colors.error }}>
                      ({checkOutInside ? 'Inside' : 'Outside'})
                    </Text>
                  </Text>
                </View>
              </View>
            </>
          )}

        </View>

      </ScrollView>

      {/* Full Screen Photo Modal */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.photoModalContainer}>
          <TouchableOpacity 
            style={styles.photoModalClose} 
            onPress={() => setIsPhotoModalVisible(false)}
          >
            <Icon name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Image 
            source={{ uri: record.selfiePath?.startsWith('file://') || record.selfiePath?.startsWith('http') ? record.selfiePath : `file://${record.selfiePath}` }} 
            style={styles.fullScreenImage} 
            resizeMode="contain"
          />
        </View>
      </Modal>

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
            <Text style={styles.fullScreenMapTitle}>GPS Coverage</Text>
            <View style={{ width: 24 }} />
          </View>

          <MapView
            ref={fullMapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: record.checkInLat,
              longitude: record.checkInLng,
              latitudeDelta: showCheckOut ? 0.05 : 0.025,
              longitudeDelta: showCheckOut ? 0.05 : 0.025,
            }}
            customMapStyle={mapDarkStyle}
            onMapReady={() => handleMapReady(fullMapRef.current)}
          >
            {/* Check-In Marker */}
            <Marker coordinate={{ latitude: record.checkInLat, longitude: record.checkInLng }} title="Check-In">
              <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
                <Icon name="login" size={16} color={Colors.white} />
              </View>
            </Marker>

            {/* Check-Out Marker */}
            {showCheckOut && (
              <Marker coordinate={{ latitude: record.checkOutLat, longitude: record.checkOutLng }} title="Check-Out">
                <View style={[styles.markerPin, { backgroundColor: Colors.error }]}>
                  <Icon name="logout" size={16} color={Colors.white} />
                </View>
              </Marker>
            )}

            <Circle
              center={{ latitude: record.checkInLat, longitude: record.checkInLng }}
              radius={200}
              strokeWidth={1.5}
              strokeColor={checkInInside ? Colors.success : Colors.warning}
              fillColor={checkInInside ? Colors.successGlow : Colors.warningGlow}
            />

            {showCheckOut && (
              <Circle
                center={{ latitude: record.checkOutLat, longitude: record.checkOutLng }}
                radius={200}
                strokeWidth={1.5}
                strokeColor={checkOutInside ? Colors.error : Colors.warning}
                fillColor={checkOutInside ? Colors.errorGlow : Colors.warningGlow}
              />
            )}
          </MapView>
        </ScreenWrapper>
      </Modal>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: moderateScale(20), color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.screenPadding.horizontal, paddingBottom: 20 },
  
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold, fontSize: moderateScale(14), color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dateText: { fontFamily: Fonts.semiBold, fontSize: moderateScale(16), color: Colors.textPrimary, marginLeft: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeVal: { fontFamily: Fonts.medium, fontSize: moderateScale(14), color: Colors.textPrimary },
  
  selfieContainer: {
    height: verticalScale(200),
    borderRadius: Spacing.radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
    position: 'relative',
  },
  selfieImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  expandIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  fullScreenPhoto: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
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
  
  mapContainer: {
    height: verticalScale(200),
    borderRadius: Spacing.radius.sm,
    overflow: 'hidden',
  },
  map: { ...StyleSheet.absoluteFillObject },
  markerPin: {
    width: scale(30), height: verticalScale(30), borderRadius: moderateScale(15),
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white,
  },
  
  statusBlock: { marginVertical: 4 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTitle: { fontFamily: Fonts.semiBold, fontSize: moderateScale(14), color: Colors.textPrimary },
  placeVal: { fontFamily: Fonts.regular, fontSize: moderateScale(13), color: Colors.textPrimary, marginTop: 4 },
  coordValSmall: { fontFamily: Fonts.regular, fontSize: moderateScale(11), color: Colors.textMuted, marginTop: 2 },
  
  geofenceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, backgroundColor: Colors.surfaceLight, padding: 8, borderRadius: 6 },
  geofenceText: { fontFamily: Fonts.medium, fontSize: moderateScale(12), color: Colors.textSecondary, marginLeft: 6, flexShrink: 1 },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});

export default AttendanceDetailsScreen;
