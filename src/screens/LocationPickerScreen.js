import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts } from '../theme/fonts';
import { moderateScale, verticalScale } from '../utils/responsive';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const GOOGLE_PLACES_API_KEY = "AIzaSyB-Epzh0bpcXLhrHzSdztyoemggD607530";

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
];

const LocationPickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { initialCoordinate, onLocationSelected } = route.params || {};

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [selectedCoord, setSelectedCoord] = useState(
    initialCoordinate || { latitude: 13.045672, longitude: 80.241572 }
  );
  const [selectedName, setSelectedName] = useState('');

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Attempt to find the most specific place name (usually the first part of the formatted address)
        const bestMatch = data.results.find(r => r.types.includes('point_of_interest') || r.types.includes('establishment') || r.types.includes('route')) || data.results[0];

        // Extract the primary name (take up to the first two parts for better context, avoiding single numbers like "No.7")
        const parts = bestMatch.formatted_address.split(',');
        const primaryName = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : parts[0].trim();

        setSelectedName(primaryName);
        autocompleteRef.current?.setAddressText(primaryName);
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
    }
  };

  // Fetch initial address on mount so the location name is available immediately
  // even if the user just confirms without moving the marker.
  useEffect(() => {
    if (selectedCoord) {
      fetchAddressFromCoordinates(selectedCoord.latitude, selectedCoord.longitude);
    }
  }, [selectedCoord]);

  const handleConfirm = () => {
    if (onLocationSelected) {
      onLocationSelected(selectedCoord.latitude, selectedCoord.longitude, selectedName);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={mapDarkStyle}
        initialRegion={{
          latitude: selectedCoord.latitude,
          longitude: selectedCoord.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        onPress={(e) => {
          const coord = e.nativeEvent.coordinate;
          setSelectedCoord(coord);
          fetchAddressFromCoordinates(coord.latitude, coord.longitude);
        }}
      >
        <Marker
          coordinate={selectedCoord}
          draggable
          onDragEnd={(e) => {
            const coord = e.nativeEvent.coordinate;
            setSelectedCoord(coord);
            fetchAddressFromCoordinates(coord.latitude, coord.longitude);
          }}
        />
      </MapView>

      {/* Search Autocomplete */}
      <View style={[styles.searchSafeArea, { elevation: 10 }]} pointerEvents="box-none">
        <View style={[styles.headerRow, { elevation: 10, zIndex: 10, paddingTop: Math.max(insets.top + 10, 12) }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <GooglePlacesAutocomplete
              ref={autocompleteRef}
              placeholder="Search for places..."
              minLength={2}
              fetchDetails={true}
              debounce={300}
              keyboardShouldPersistTaps="always"
              listElevated={true}
              onPress={(data, details = null) => {
                if (details && details.geometry) {
                  const lat = details.geometry.location.lat;
                  const lng = details.geometry.location.lng;
                  const name = data.structured_formatting?.main_text || data.description;
                  setSelectedName(name);
                  setSelectedCoord({ latitude: lat, longitude: lng });
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }, 500);
                  }
                }
              }}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en',
                location: `${initialCoordinate?.latitude || 13.045672},${initialCoordinate?.longitude || 80.241572}`,
                radius: 50000, // 50km bias
              }}
              renderRightButton={() => (
                <TouchableOpacity
                  style={{ justifyContent: 'center', paddingRight: Spacing.md }}
                  onPress={() => autocompleteRef.current?.setAddressText('')}
                >
                  <Icon name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              styles={{
                container: {
                  flex: 1,
                },
                textInputContainer: {
                  backgroundColor: Colors.surface,
                  borderRadius: Spacing.radius.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                },
                textInput: {
                  fontFamily: Fonts.regular,
                  color: Colors.textPrimary,
                  fontSize: moderateScale(15),
                  backgroundColor: 'transparent',
                  flex: 1,
                  height: 50,
                  margin: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 16,
                  paddingRight: 8,
                },
                listView: {
                  backgroundColor: Colors.surface,
                  borderRadius: Spacing.radius.md,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  elevation: 10,
                  maxHeight: 250,
                  marginTop: 4,
                },
                row: {
                  backgroundColor: Colors.surface,
                  padding: Spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
                description: {
                  fontFamily: Fonts.regular,
                  color: Colors.textPrimary,
                  fontSize: moderateScale(13),
                },
                separator: {
                  backgroundColor: Colors.divider,
                  height: 1,
                },
              }}
              textInputProps={{
                placeholderTextColor: Colors.textMuted,
              }}
            />
          </View>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomSafeArea}>
        <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <Text style={styles.instructions}>Tap on the map or drag the marker to set the exact location.</Text>
          <View style={styles.coordDisplayRow}>
            <Text style={styles.coordText}>Lat: {selectedCoord.latitude.toFixed(6)}</Text>
            <Text style={styles.coordText}>Lng: {selectedCoord.longitude.toFixed(6)}</Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  bottomPanel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radius.lg,
    borderTopRightRadius: Spacing.radius.lg,
    padding: Spacing.lg,
    paddingBottom: verticalScale(30),
    ...Spacing.shadows.lg,
  },
  instructions: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(14),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  coordDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Spacing.radius.md,
  },
  coordText: {
    fontFamily: Fonts.medium,
    fontSize: moderateScale(13),
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: verticalScale(14),
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(16),
    color: Colors.white,
  },
});

export default LocationPickerScreen;
