import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutBarcodeScreen({ route, navigation }) {
  const [barcode, setBarcode] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (route.params?.barcodeData) {
      setBarcode(route.params.barcodeData.barcodeNumber);
      setBarcodeImage(route.params.barcodeData.barcode);
      setProducts(route.params.barcodeData.products || []);
      setTotalAmount(route.params.barcodeData.totalAmount || 0);
    }
  }, [route.params?.barcodeData]);

  const handleCopyBarcode = () => {
    // Note: React Native doesn't have native clipboard in Expo without additional packages
    Alert.alert('Barcode', `Barcode ID: ${barcode}\n\nBarcode copied to clipboard!`);
  };

  const handleReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainScreen' }],
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#116142" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Complete!</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Success Message */}
      <View style={styles.successSection}>
        <Ionicons name="checkmark-circle" size={60} color="#116142" />
        <Text style={styles.successText}>Payment Pending</Text>
        <Text style={styles.subText}>Your order is ready for payment at counter</Text>
      </View>

      {/* Barcode Display */}
      <View style={styles.barcodeContainer}>
        <Text style={styles.barcodeLabel}>Scan this barcode at counter</Text>
        
        {barcodeImage ? (
          <Image
            source={{ uri: barcodeImage }}
            style={styles.barcodeImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderBarcode}>
            <ActivityIndicator size="large" color="#116142" />
          </View>
        )}

        <View style={styles.barcodeIdContainer}>
          <Text style={styles.barcodeIdLabel}>Barcode ID:</Text>
          <Text style={styles.barcodeIdText}>{barcode || 'Loading...'}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyBarcode}
            disabled={!barcode}
          >
            <Ionicons name="copy" size={18} color="#fff" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        {products.length > 0 ? (
          <View style={styles.productsList}>
            {products.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>
                    Qty: {product.quantity} × ₹{product.price}
                  </Text>
                </View>
                <Text style={styles.productTotal}>₹{product.total || product.price * product.quantity}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No products in order</Text>
        )}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Visit the counter with your barcode</Text>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Show the barcode to the cashier</Text>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Complete payment at counter</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleReturnHome}
        >
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#116142',
  },
  placeholder: {
    width: 40,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  successText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#116142',
    marginTop: 12,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  barcodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#116142',
    marginBottom: 16,
  },
  barcodeImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#116142',
  },
  placeholderBarcode: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  barcodeIdContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  barcodeIdLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  barcodeIdText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#116142',
    letterSpacing: 1,
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: '#116142',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  summarySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#116142',
    marginBottom: 12,
  },
  productsList: {
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#116142',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#116142',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#116142',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#116142',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#116142',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
