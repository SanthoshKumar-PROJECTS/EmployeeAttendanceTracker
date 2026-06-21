import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useAlertStore from '../store/useAlertStore';
import { Colors } from '../theme/colors';
import { Fonts } from '../theme/fonts';
import { Spacing } from '../theme/spacing';
import { moderateScale, scale, verticalScale } from '../utils/responsive';

const { width } = Dimensions.get('window');

const GlobalAlertModal = () => {
  const { isVisible, title, message, buttons, options, hideAlert } = useAlertStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, scaleAnim]);

  if (!isVisible && fadeAnim._value === 0) return null;

  // Determine icon and color based on title or options
  let iconName = 'bell-outline';
  let iconColor = Colors.primary;
  
  const lowerTitle = title?.toLowerCase() || '';
  if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('denied')) {
    iconName = 'alert-circle-outline';
    iconColor = Colors.error;
  } else if (lowerTitle.includes('success') || lowerTitle.includes('✅')) {
    iconName = 'check-circle-outline';
    iconColor = Colors.success;
  } else if (lowerTitle.includes('warning') || lowerTitle.includes('required')) {
    iconName = 'alert-outline';
    iconColor = Colors.warning;
  }

  const handleButtonPress = (btn) => {
    hideAlert();
    if (btn.onPress) {
      // Execute immediately without setTimeout to prevent async swallowing
      btn.onPress();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      onRequestClose={() => {
        if (options?.cancelable !== false) {
          hideAlert();
        }
      }}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          {options?.cancelable !== false && (
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={hideAlert} />
          )}
        </Animated.View>

        <Animated.View 
          style={[styles.modalContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          {/* Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Icon name={iconName} size={36} color={iconColor} />
          </View>

          {/* Text Content */}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={[
            styles.buttonContainer, 
            buttons.length > 2 ? { flexDirection: 'column' } : { flexDirection: 'row' }
          ]}>
            {buttons.map((btn, index) => {
              // Determine button style
              const isDestructive = btn.style === 'destructive' || btn.text?.toLowerCase() === 'delete' || btn.text?.toLowerCase() === 'logout';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              return (
                <TouchableOpacity
                  key={index.toString()}
                  style={[
                    styles.button,
                    buttons.length === 1 && { width: '100%' },
                    buttons.length === 2 && { flex: 1 },
                    buttons.length > 2 && { width: '100%', marginBottom: Spacing.sm },
                    index > 0 && buttons.length === 2 && { marginLeft: Spacing.sm },
                    isPrimary && styles.buttonPrimary,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive
                  ]}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    isPrimary && styles.buttonTextPrimary,
                    isCancel && styles.buttonTextCancel,
                    isDestructive && styles.buttonTextDestructive
                  ]}>
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: scale(64),
    height: verticalScale(64),
    borderRadius: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: moderateScale(18),
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(14),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonTextPrimary: {
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    fontSize: moderateScale(15),
    textAlign: 'center',
  },

  buttonCancel: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonTextCancel: {
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    fontSize: moderateScale(15),
    textAlign: 'center',
  },

  buttonDestructive: {
    backgroundColor: Colors.errorGlow,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  buttonTextDestructive: {
    fontFamily: Fonts.semiBold,
    color: Colors.error,
    fontSize: moderateScale(15),
    textAlign: 'center',
  },
});

export default GlobalAlertModal;
