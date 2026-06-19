/**
 * Custom Camera Modal
 * Implements react-native-vision-camera to strictly enforce the use of the front
 * camera without providing a flip/switch button. Falls back to back camera only
 * if the device lacks a front camera.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Fonts } from '../theme/fonts';
import { Spacing } from '../theme/spacing';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const CustomCameraModal = ({ visible, onClose, onPhotoCaptured }) => {
  const cameraRef = useRef(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCapturing, setIsCapturing] = useState(false);
  const photoOutput = usePhotoOutput();

  // Strictly prefer front camera. Only fallback to back if front is null.
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice || backDevice;

  useEffect(() => {
    if (visible && !hasPermission) {
      checkPermissions();
    }
  }, [visible, hasPermission]);

  const checkPermissions = async () => {
    const isGranted = await requestPermission();
    if (!isGranted) {
      Alert.alert('Permission Denied', 'Camera permission is required to capture your selfie.');
      onClose();
    }
  };

  const handleCapture = async () => {
    if (!isCapturing) {
      try {
        setIsCapturing(true);
        const photoFile = await photoOutput.capturePhotoToFile(
          { flashMode: 'off' },
          {}
        );
        
        // Pass the temp path back
        onPhotoCaptured(`file://${photoFile.filePath}`);
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {hasPermission && device ? (
          <>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              outputs={[photoOutput]}
            />

            {/* Top Controls */}
            <SafeAreaView style={styles.topControls}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
              <View style={styles.instructionBadge}>
                <Icon name="face-recognition" size={18} color={Colors.white} />
                <Text style={styles.instructionText}>
                  {frontDevice ? 'Front Camera Active' : 'Camera Active'}
                </Text>
              </View>
            </SafeAreaView>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <View style={styles.captureContainer}>
                <TouchableOpacity
                  style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                  onPress={handleCapture}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="large" color={Colors.primary} />
                  ) : (
                    <View style={styles.captureInner} />
                  )}
                </TouchableOpacity>
                <Text style={styles.captureHint}>Tap to Capture</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Initializing Camera...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    marginTop: Spacing.md,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl, // Safe area padding fallback
  },
  closeButton: {
    width: scale(44),
    height: verticalScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: moderateScale(20),
    gap: 8,
  },
  instructionText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: moderateScale(14),
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl * 2,
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: scale(80),
    height: verticalScale(80),
    borderRadius: moderateScale(40),
    borderWidth: 4,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  captureButtonDisabled: {
    borderColor: Colors.textMuted,
  },
  captureInner: {
    width: scale(64),
    height: verticalScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: Colors.white,
  },
  captureHint: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: moderateScale(14),
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default CustomCameraModal;
