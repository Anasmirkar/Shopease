/**
 * Scanner Hook
 * Custom hook for scanner functionality and animations
 */

import { useState, useRef, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { AppConstants } from '../constants';
import { productService } from '../services';

export const useScanner = (onProductScanned) => {
  // States
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Refs
  const cameraRef = useRef(null);
  const inactivityTimer = useRef(null);

  // Animations
  const scannerFadeAnim = useRef(new Animated.Value(0)).current;
  const scanBoxAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerGlowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          AppConstants.ERROR_MESSAGES.CAMERA_PERMISSION,
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Handle camera visibility and animations
  useEffect(() => {
    if (isCameraVisible) {
      startAnimations();
      setupInactivityTimer();
    } else {
      resetAnimations();
      clearInactivityTimer();
    }

    return () => {
      clearInactivityTimer();
    };
  }, [isCameraVisible]);

  /**
   * Start scanner animations
   */
  const startAnimations = () => {
    // Fade in scanner overlay
    Animated.timing(scannerFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Scale in scan box
    Animated.timing(scanBoxAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Start scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: AppConstants.SCAN_LINE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: AppConstants.SCAN_LINE_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: AppConstants.PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: AppConstants.PULSE_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start corner glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerGlowAnim, {
          toValue: 1,
          duration: AppConstants.CORNER_GLOW_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(cornerGlowAnim, {
          toValue: 0,
          duration: AppConstants.CORNER_GLOW_DURATION,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start particles animation
    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: AppConstants.PARTICLES_DURATION,
        useNativeDriver: true,
      })
    ).start();
  };

  /**
   * Reset animations
   */
  const resetAnimations = () => {
    scannerFadeAnim.setValue(0);
    scanBoxAnim.setValue(0.8);
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);
    cornerGlowAnim.setValue(0);
    particleAnim.setValue(0);
  };

  /**
   * Setup inactivity timer
   */
  const setupInactivityTimer = () => {
    inactivityTimer.current = setTimeout(() => {
      setIsCameraVisible(false);
    }, AppConstants.SCANNER_TIMEOUT);
  };

  /**
   * Clear inactivity timer
   */
  const clearInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  /**
   * Handle barcode scan
   */
  const handleBarcodeScanned = async ({ type, data }) => {
    if (isScanning) return;

    setIsScanning(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Try to get product from API, fallback to mock data
      let product;
      try {
        const response = await productService.scanProduct(data);
        product = response.data;
      } catch (error) {
        console.log('API scan failed, using mock data:', error);
        product = productService.getMockProduct(data);
      }

      if (product && onProductScanned) {
        onProductScanned({
          ...product,
          id: product.id || Date.now().toString(),
          quantity: 1,
          scannedAt: new Date().toISOString(),
        });
      }

      setIsCameraVisible(false);
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Unable to scan product. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Start scanning
   */
  const startScanning = () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', AppConstants.ERROR_MESSAGES.CAMERA_PERMISSION);
      return;
    }
    
    setIsCameraVisible(true);
  };

  /**
   * Stop scanning
   */
  const stopScanning = () => {
    setIsCameraVisible(false);
  };

  return {
    // States
    hasPermission,
    isCameraVisible,
    isScanning,
    torchOn,
    
    // Refs
    cameraRef,
    
    // Animations
    scannerFadeAnim,
    scanBoxAnim,
    pulseAnim,
    scanLineAnim,
    cornerGlowAnim,
    particleAnim,
    
    // Methods
    startScanning,
    stopScanning,
    setTorchOn,
    handleBarcodeScanned,
  };
};