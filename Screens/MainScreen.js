import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Modal, Pressable, Animated, Alert, Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserProfileSlideBar from './UserProfileSlideBar';
import { supabase } from '../supabaseClient';
import { API_CONFIG } from '../config';

const { width, height } = Dimensions.get('window');

export default function MainAppScreen({ user, selectedStore, navigation, onLogout }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProducts, setScannedProducts] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [profileSlideBarVisible, setProfileSlideBarVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const cameraRef = useRef(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scannerFadeAnim = useRef(new Animated.Value(0)).current;
  const scanBoxAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // New scanner animations
  const cornerGlowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  
  // Timer for auto-close
  const inactivityTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to scan barcodes.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Enhanced scanner animations
  useEffect(() => {
    if (isCameraVisible) {
      // Fade in scanner overlay
      Animated.parallel([
        Animated.timing(scannerFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(scanBoxAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ]).start();
      
      // Start scanning line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      
      // Start pulse animation for scan box
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Start corner glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerGlowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(cornerGlowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();

      // Start floating particles animation
      Animated.loop(
        Animated.timing(particleAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      ).start();
      
      // Set up inactivity timer (25 seconds)
      inactivityTimer.current = setTimeout(() => {
        setIsCameraVisible(false);
      }, 25000);
    } else {
      // Reset animations when camera is closed
      scannerFadeAnim.setValue(0);
      scanBoxAnim.setValue(0.8);
      pulseAnim.setValue(1);
      scanLineAnim.setValue(0);
      cornerGlowAnim.setValue(0);
      particleAnim.setValue(0);
      
      // Clear inactivity timer
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    }
    
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };
  }, [isCameraVisible]);

  if (hasPermission === null) {
    return <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center' }}>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center' }}>No access to camera</Text>;
  }

  // Enhanced scan button handler with animation
  const handleStartScanning = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    
    setIsCameraVisible(true);
    setIsScanning(true);
  };
  
  // Handle barcode scanning with enhanced feedback
  const handleBarcodeScanned = async ({ type, data }) => {
    if (isScanning) {
      setIsScanning(false);
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Clear inactivity timer since user is active
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
          setIsCameraVisible(false);
          Alert.alert('Scanner Timeout', 'Scanner closed due to inactivity.');
        }, 25000);
      }
      
      const barcode = data.trim();
      if (!selectedStore || !selectedStore.id) {
        Alert.alert('Error', 'No store selected.');
        setIsCameraVisible(false);
        return;
      }
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('store_id', selectedStore.id)
        .limit(1);
      if (error) {
        Alert.alert('Error', 'Failed to fetch product: ' + (error.message || 'Unknown error'));
        setIsCameraVisible(false);
        setIsScanning(true);
        return;
      }
      if (!products || products.length === 0) {
        Alert.alert('Not Found', 'Product not found for this store.');
        setIsScanning(true); // Allow scanning again
        return;
      }
      
      const product = products[0];
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Always ignore any quantity from DB, always set to 1 for new
      const existingIndex = scannedProducts.findIndex(p => p.id === product.id);
      if (existingIndex !== -1) {
        const updated = scannedProducts.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: (typeof item.quantity === 'number' ? item.quantity : 1) + 1 }
            : item
        );
        setScannedProducts(updated);
      } else {
        setScannedProducts([
          ...scannedProducts,
          {
            ...product,
            basketItemId: Date.now().toString(),
            type: type,
            quantity: 1, // always start at 1
          },
        ]);
      }
      
      // Show success feedback and close scanner after short delay
      setTimeout(() => {
        setIsCameraVisible(false);
      }, 1000);
    }
  };

  // Remove product
  const removeProduct = (id) => {
    const updatedList = scannedProducts.filter((item) => item.id !== id);
    setScannedProducts(updatedList);
  };

  // Quantity controls
  const increaseQuantity = (id) => {
    setScannedProducts(products => products.map(item =>
      item.id === id ? { ...item, quantity: (typeof item.quantity === 'number' ? item.quantity : 1) + 1 } : item
    ));
  };
  const decreaseQuantity = (id) => {
    setScannedProducts(products => {
      return products
        .map(item => item.id === id ? { ...item, quantity: (typeof item.quantity === 'number' ? item.quantity : 1) - 1 } : item)
        .filter(item => item.quantity > 0);
    });
  };

  // Handle back navigation - Remove back button if no navigation
  const handleGoBack = () => {
    // Only show back button if navigation is available
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  // Checkout handler - Generate barcode for counter payment
  const handleCheckout = async () => {
    if (!scannedProducts || scannedProducts.length === 0) {
      Alert.alert('Empty Basket', 'Please scan products before checkout');
      return;
    }

    // Calculate totals
    const totalAmount = scannedProducts.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);

    try {
      setPaymentModalVisible(false);

      const checkoutPayload = {
        userId: user?.id || user?._id,
        storeId: selectedStore?.id,
        products: scannedProducts.map(p => ({
          barcode: p.barcode,
          name: p.name,
          product_id: p.id,
          quantity: p.quantity || 1,
          price: p.price,
          weight: p.weight,
          total: parseFloat(p.price) * (p.quantity || 1)
        })),
        totalAmount
      };

      console.log('Checkout payload:', JSON.stringify(checkoutPayload, null, 2));
      console.log('API URL:', `${API_CONFIG.BASE_URL}/checkout`);

      const response = await fetch(`${API_CONFIG.BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload)
      });

      const data = await response.json();
      console.log('Checkout response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('Checkout error:', data);
        Alert.alert('Checkout Failed', data.message || 'Failed to generate barcode');
        return;
      }

      // Navigate to barcode screen with the checkout data
      navigation.navigate('CheckoutBarcode', {
        barcodeData: {
          barcodeNumber: data.barcodeNumber,
          barcode: data.barcode,
          products: checkoutPayload.products,
          totalAmount: checkoutPayload.totalAmount
        }
      });

      // Clear products after successful checkout
      setScannedProducts([]);

    } catch (error) {
      Alert.alert('Error', 'Failed to process checkout: ' + error.message);
    }
  };

  // Handle receipt close and cart clear
  const handleReceiptClose = () => {
    setReceiptModalVisible(false);
    setScannedProducts([]);
    setReceiptData(null);
  };

  // Generate receipt
  const generateReceipt = async (paymentMethod) => {
    const receiptNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    const totalWeight = scannedProducts.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
    const totalAmount = scannedProducts.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

    const receiptData = {
      receiptNumber,
      date,
      time,
      customerName: user?.name || 'Customer',
      customerPhone: user?.phone || 'N/A',
      products: scannedProducts,
      totalWeight,
      totalAmount,
      paymentMethod
    };

    // Show receipt immediately
    setReceiptData(receiptData);
    setReceiptModalVisible(true);

    // Save to backend (Supabase-powered API)
    if (user?.id || user?._id) {
      fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SAVE_SHOPPING_HISTORY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          receiptNumber,
          date,
          time,
          storeName: selectedStore?.name || 'Unknown Store',
          products: scannedProducts,
          totalWeight,
          totalAmount,
          paymentMethod
        }),
      })
      .then(response => {
        if (!response.ok) {
          console.log('Server responded with error:', response.status);
        } else {
          console.log('Shopping history saved successfully');
        }
      })
      .catch(error => {
        console.log('Network error - server might be offline:', error.message);
        // Don't show error to user as receipt still works without saving
      });
    }
  };

  const totalWeight = scannedProducts.reduce((sum, item) => sum + (parseFloat(item.weight || 0) * (item.quantity || 1)), 0);
  const totalAmount = scannedProducts.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      {isCameraVisible ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            onBarcodeScanned={handleBarcodeScanned}
            flash={torchOn ? 'torch' : 'off'}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
          />

          {/* Floating Action Buttons */}
          <View style={styles.floatingButtons}>
            <TouchableOpacity onPress={() => setIsCameraVisible(false)} style={styles.floatingBackButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTorchOn(!torchOn)} style={styles.floatingTorchButton}>
              <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Enhanced Animated Scanner Overlay */}
          <Animated.View 
            style={[styles.scannerOverlay, { opacity: scannerFadeAnim }]}
          >
            {/* Four-part overlay that leaves scanning area completely clear */}
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
      ) : (
        <View style={[styles.gradient, { backgroundColor: 'white' }]}>
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
              },
            ]}
          >
            {/* Green Header matching SelectStore style */}
            <View style={styles.greenHeader}>
              {navigation && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleGoBack}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>{selectedStore?.name || 'Select Store'}</Text>
              <TouchableOpacity
                style={styles.userButton}
                onPress={() => setProfileSlideBarVisible(true)}
              >
                <Ionicons name="person-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={scannedProducts.length === 0 ? styles.emptyScrollContent : styles.content}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <View style={styles.cartSection}>
                <View style={styles.cartHeader}>
                  <Ionicons name="cart" size={24} color="#116142" />
                  <Text style={styles.cartTitle}>Shopping Cart</Text>
                  <Text style={styles.cartCount}>{scannedProducts.length}</Text>
                </View>

                {scannedProducts.length === 0 ? (
                  <View style={styles.emptyCartContainer}>
                    <View style={styles.emptyCart}>
                      <Ionicons name="cart-outline" size={80} color="rgba(51, 51, 51, 0.3)" />
                      <Text style={styles.emptyCartText}>No products scanned yet</Text>
                      <Text style={styles.emptyCartSubtext}>Tap the scan button below to add items</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.productList}>
                    {scannedProducts.map((item, index) => (
                      <Animated.View
                        key={item.id}
                        style={styles.productCard}
                      >
                        <LinearGradient
                          colors={['rgba(17, 97, 66, 0.1)', 'rgba(17, 97, 66, 0.05)']}
                          style={styles.productCardGradient}
                        >
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productDetails}>{item.weight} kg • ₹{item.price}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity onPress={() => decreaseQuantity(item.id)} style={{ padding: 6, backgroundColor: '#eee', borderRadius: 8, marginRight: 4 }}>
                              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>-</Text>
                            </TouchableOpacity>
                            <Text style={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold', color: '#333' }}>{item.quantity || 1}</Text>
                            <TouchableOpacity onPress={() => increaseQuantity(item.id)} style={{ padding: 6, backgroundColor: '#eee', borderRadius: 8, marginLeft: 4 }}>
                              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>+</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => removeProduct(item.id)}
                              style={styles.removeButton}
                            >
                              <Ionicons name="trash" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    ))}

                    <View style={styles.totalSection}>
                      <LinearGradient
                        colors={['rgba(17, 97, 66, 0.15)', 'rgba(17, 97, 66, 0.1)']}
                        style={styles.totalCard}
                      >
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total Weight:</Text>
                          <Text style={styles.totalValue}>{totalWeight.toFixed(2)} kg</Text>
                        </View>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total Amount:</Text>
                          <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Circular Scan Button at Bottom */}
            <View style={styles.bottomButtonContainer}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={styles.circularScanButton}
                  onPress={handleStartScanning}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#116142', '#0e4a34', '#0b3d2e']}
                    style={styles.circularScanButtonGradient}
                  >
                    <Ionicons name="qr-code" size={35} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {scannedProducts.length > 0 && (
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => setPaymentModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.checkoutButtonGradient}
                >
                  <Ionicons name="card" size={24} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Modal visible={paymentModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <Animated.View style={styles.modalBox}>
                <LinearGradient
                  colors={['#1a1a2e', '#16213e']}
                  style={styles.modalGradient}
                >
                  <Text style={styles.modalTitle}>Proceed to Checkout</Text>
                  
                  <TouchableOpacity style={styles.paymentOption} onPress={handleCheckout}>
                    <Ionicons name="barcode" size={24} color="#4ECDC4" />
                    <Text style={styles.paymentText}>Generate Barcode</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPaymentModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
          </Modal>

          <Modal visible={receiptModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <Animated.View style={styles.receiptBox}>
                <LinearGradient
                  colors={['#fff', '#f8f9fa']}
                  style={styles.receiptGradient}
                >
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.receiptHeader}>
                      <Ionicons name="receipt" size={40} color="#1a1a2e" />
                      <Text style={styles.receiptTitle}>Payment Receipt</Text>
                    </View>
                    
                    <View style={styles.receiptDetails}>
                      <Text style={styles.receiptInfo}>Receipt #: {receiptData?.receiptNumber}</Text>
                      <Text style={styles.receiptInfo}>Date: {receiptData?.date}</Text>
                      <Text style={styles.receiptInfo}>Time: {receiptData?.time}</Text>
                      <Text style={styles.receiptInfo}>Customer: {receiptData?.customerName}</Text>
                      <Text style={styles.receiptInfo}>Phone: {receiptData?.customerPhone}</Text>
                    </View>

                    <Text style={styles.receiptSubtitle}>Items Purchased:</Text>
                    {receiptData?.products.map((item, index) => (
                      <View key={item.id} style={styles.receiptItem}>
                        <Text style={styles.receiptItemText}>
                          {index + 1}. {item.name} - {item.weight}kg - ₹{item.price}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.receiptTotals}>
                      <Text style={styles.receiptTotal}>Total Weight: {receiptData?.totalWeight?.toFixed(2)} kg</Text>
                      <Text style={styles.receiptTotal}>Total Amount: ₹{receiptData?.totalAmount?.toFixed(2)}</Text>
                      <Text style={styles.receiptPayment}>Payment Method: {receiptData?.paymentMethod}</Text>
                    </View>
                  </ScrollView>
                  
                  <TouchableOpacity
                    style={styles.closeReceiptButton}
                    onPress={handleReceiptClose}
                  >
                    <Text style={styles.closeReceiptText}>Close Receipt</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
          </Modal>

          {/* User Profile Slide Bar */}
          <UserProfileSlideBar
            isVisible={profileSlideBarVisible}
            onClose={() => setProfileSlideBarVisible(false)}
            user={user}
            selectedStore={selectedStore}
            onLogout={onLogout}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  animatedContainer: { flex: 1 },
  // Green Header Section (matching SelectStore)
  greenHeader: {
    backgroundColor: '#116142',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'System',
  },
  placeholder: { width: 40 },
  userButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
  },
  content: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
    paddingBottom: 100, // Add space for bottom button
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  circularScanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#116142',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  circularScanButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  storeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  storeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  storeIcon: { fontSize: 24 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  storeSubtext: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' },
  userCard: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  userCardGradient: { padding: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userDetails: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  userPhone: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' },
  cartSection: { marginBottom: 20 },
  cartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 25 },
  cartTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginLeft: 10, flex: 1 },
  cartCount: {
    backgroundColor: '#FF6B6B',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  emptyScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Account for bottom button
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartText: {
    fontSize: 20,
    color: '#666',
    marginTop: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  productList: { gap: 10 },
  productCard: { borderRadius: 12, overflow: 'hidden' },
  productCardGradient: { padding: 15, flexDirection: 'row', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  productDetails: { fontSize: 14, color: '#666' },
  removeButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255, 107, 107, 0.2)' },
  totalSection: { marginTop: 15 },
  totalCard: { padding: 15, borderRadius: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#116142' },
  checkoutButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkoutButtonGradient: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  checkoutButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  // Enhanced Camera styles
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { width: '100%', height: '100%' },
  
  // Floating Action Buttons
  floatingButtons: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingBackButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingTorchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Enhanced Scanner Overlay
  enhancedOverlay: {
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
    transform: [{ translateY: -200 }], // Move up to leave center clear
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    transform: [{ translateY: 200 }], // Move down to leave center clear  
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayLeft: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '50%',
    height: 280,
    transform: [{ translateY: -140 }, { translateX: -200 }], // Center vertically, move left
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayRight: {
    position: 'absolute',
    top: '50%',
    right: 0,
    width: '50%', 
    height: 280,
    transform: [{ translateY: -140 }, { translateX: 200 }], // Center vertically, move right
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scannerBox: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00D4AA',
    backgroundColor: 'transparent',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  scannerCorners: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cornerIndicator: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FFFF',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  enhancedScanLine: {
    position: 'absolute',
    height: 3,
    width: '90%',
    backgroundColor: '#FF0040',
    shadowColor: '#FF0040',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  helperTextContainer: {
    position: 'absolute',
    bottom: height * 0.2,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  helperText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  helperSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  modalBox: { width: '90%', borderRadius: 20, overflow: 'hidden', maxHeight: '80%' },
  modalGradient: { padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 25 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentText: { fontSize: 16, color: '#fff', marginLeft: 15, flex: 1 },
  cancelButton: { marginTop: 10, padding: 15, backgroundColor: 'rgba(255, 107, 107, 0.2)', borderRadius: 12 },
  cancelButtonText: { fontSize: 16, color: '#FF6B6B', textAlign: 'center', fontWeight: '600' },
  receiptBox: { width: '90%', borderRadius: 20, overflow: 'hidden', maxHeight: '80%' },
  receiptGradient: { padding: 25 },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  receiptTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
  receiptDetails: { marginBottom: 20 },
  receiptInfo: { fontSize: 14, color: '#666', marginBottom: 5 },
  receiptSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10 },
  receiptItem: { marginBottom: 5 },
  receiptItemText: { fontSize: 14, color: '#333' },
  receiptTotals: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  receiptTotal: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 5 },
  receiptPayment: { fontSize: 14, color: '#666', marginTop: 10 },
  closeReceiptButton: { marginTop: 20, padding: 15, backgroundColor: '#1a1a2e', borderRadius: 12 },
  closeReceiptText: { fontSize: 16, color: '#fff', textAlign: 'center', fontWeight: '600' },
  
  // Simple Green Scanner
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -60 }], // Move scanner upward
  },
  greenBorder: {
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#116142',
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#116142',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Enhanced Scanner Animation Styles
  scanLine: {
    position: 'absolute',
    width: '90%',
    height: 3,
    backgroundColor: '#00FFFF',
    borderRadius: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  
  scannerCorners: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  cornerIndicator: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#116142',
    borderWidth: 3,
  },
  
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  
  // Floating Particles
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
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
    top: '50%',
  },
});