/**
 * Scanner Component
 * Reusable animated scanner component with clear scanning area
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Dimensions, AppConstants } from '../constants';

export const Scanner = ({
  cameraRef,
  onBarcodeScanned,
  torchOn,
  onToggleTorch,
  onClose,
  // Animation values
  scannerFadeAnim,
  scanBoxAnim,
  pulseAnim,
  scanLineAnim,
  cornerGlowAnim,
  particleAnim,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        onBarcodeScanned={onBarcodeScanned}
        flash={torchOn ? 'torch' : 'off'}
        barcodeScannerSettings={{ 
          barcodeTypes: AppConstants.SCANNER_BARCODE_TYPES 
        }}
      />

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity onPress={onClose} style={styles.floatingButton}>
          <Ionicons name="arrow-back" size={Dimensions.ICON_MEDIUM} color={Colors.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleTorch} style={styles.floatingButton}>
          <Ionicons 
            name={torchOn ? 'flash' : 'flash-off'} 
            size={Dimensions.ICON_MEDIUM} 
            color={Colors.WHITE} 
          />
        </TouchableOpacity>
      </View>

      {/* Scanner Overlay with Clear Center */}
      <Animated.View style={[styles.scannerOverlay, { opacity: scannerFadeAnim }]}>
        {/* Four-part overlay that leaves scanning area clear */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />
        <View style={styles.overlayLeft} />
        <View style={styles.overlayRight} />
        
        {/* Enhanced Scanner Frame with Animations */}
        <Animated.View 
          style={[
            styles.scannerFrame,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Green square border with glow effect */}
          <Animated.View 
            style={[
              styles.greenBorder,
              { shadowOpacity: cornerGlowAnim }
            ]} 
          />
          
          {/* Scanning line animation */}
          <Animated.View 
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-120, 120]
                  })
                }]
              }
            ]}
          />
          
          {/* Corner indicators with pulse */}
          <View style={styles.scannerCorners}>
            <Animated.View style={[styles.cornerIndicator, styles.topLeft, { opacity: cornerGlowAnim }]} />
            <Animated.View style={[styles.cornerIndicator, styles.topRight, { opacity: cornerGlowAnim }]} />
            <Animated.View style={[styles.cornerIndicator, styles.bottomLeft, { opacity: cornerGlowAnim }]} />
            <Animated.View style={[styles.cornerIndicator, styles.bottomRight, { opacity: cornerGlowAnim }]} />
          </View>
          
          {/* Floating particles */}
          <View style={styles.particlesContainer}>
            {[...Array(6)].map((_, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.particle,
                  {
                    opacity: particleAnim,
                    transform: [{
                      translateY: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50]
                      })
                    }, {
                      scale: particleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0]
                      })
                    }]
                  },
                  { left: `${15 + index * 12}%` }
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BLACK,
  },
  
  camera: {
    width: '100%',
    height: '100%',
  },
  
  // Floating Action Buttons
  floatingButtons: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: Dimensions.SPACING_LARGE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  
  floatingButton: {
    width: Dimensions.FLOATING_BUTTON_SIZE,
    height: Dimensions.FLOATING_BUTTON_SIZE,
    borderRadius: Dimensions.FLOATING_BUTTON_SIZE / 2,
    backgroundColor: Colors.OVERLAY_DARK,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Scanner Overlay
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Four-part overlay system - leaves 280x280 center area completely clear
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    transform: [{ translateY: -200 }],
    backgroundColor: Colors.OVERLAY_DARK,
  },
  
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    transform: [{ translateY: 200 }],
    backgroundColor: Colors.OVERLAY_DARK,
  },
  
  overlayLeft: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '50%',
    height: Dimensions.SCANNER_SIZE,
    transform: [{ translateY: -140 }, { translateX: -200 }],
    backgroundColor: Colors.OVERLAY_DARK,
  },
  
  overlayRight: {
    position: 'absolute',
    top: '50%',
    right: 0,
    width: '50%',
    height: Dimensions.SCANNER_SIZE,
    transform: [{ translateY: -140 }, { translateX: 200 }],
    backgroundColor: Colors.OVERLAY_DARK,
  },
  
  // Scanner Frame
  scannerFrame: {
    width: Dimensions.SCANNER_SIZE,
    height: Dimensions.SCANNER_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -60 }], // Move scanner upward
  },
  
  greenBorder: {
    width: '100%',
    height: '100%',
    borderWidth: Dimensions.SCANNER_BORDER_WIDTH,
    borderColor: Colors.SCANNER_BORDER,
    borderRadius: Dimensions.BORDER_RADIUS_MEDIUM,
    backgroundColor: 'transparent',
    shadowColor: Colors.SCANNER_BORDER,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Scanning line
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 3,
    backgroundColor: Colors.SCANNER_LINE,
    borderRadius: 2,
    shadowColor: Colors.SCANNER_LINE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  
  // Corner indicators
  scannerCorners: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  cornerIndicator: {
    position: 'absolute',
    width: Dimensions.SCANNER_CORNER_SIZE,
    height: Dimensions.SCANNER_CORNER_SIZE,
    borderColor: Colors.SCANNER_BORDER,
    borderWidth: 3,
  },
  
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: Dimensions.BORDER_RADIUS_SMALL,
  },
  
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: Dimensions.BORDER_RADIUS_SMALL,
  },
  
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: Dimensions.BORDER_RADIUS_SMALL,
  },
  
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: Dimensions.BORDER_RADIUS_SMALL,
  },
  
  // Floating particles
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: Colors.SCANNER_PARTICLE,
    borderRadius: 3,
    top: '50%',
  },
});

export default Scanner;