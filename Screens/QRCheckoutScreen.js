import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function QRCheckoutScreen({ route, navigation }) {
  const {
    sessionUuid = '',
    products = [],
    totalAmount = 0,
    storeName = '',
  } = route.params || {};

  const handleContinueShopping = () => {
    navigation.navigate('MainApp');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b3d2e" />

      <LinearGradient colors={['#0b3d2e', '#116142']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success badge */}
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={26} color="#116142" />
          <Text style={styles.successText}>Cart Saved — Ready for Checkout</Text>
        </View>

        {/* QR code card */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>Show this QR code to the cashier</Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={sessionUuid || 'no-session'}
              size={248}
              color="#0b3d2e"
              backgroundColor="#ffffff"
            />
          </View>
          <Text style={styles.sessionIdLabel}>Session ID</Text>
          <Text style={styles.sessionId} numberOfLines={1} ellipsizeMode="middle">
            {sessionUuid}
          </Text>
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {storeName ? (
            <Text style={styles.storeName}>{storeName}</Text>
          ) : null}

          {products.map((item, index) => (
            <View key={index} style={styles.productRow}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.productQty}>×{item.quantity || 1}</Text>
              <Text style={styles.productPrice}>
                ₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ₹{parseFloat(totalAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Next steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Next Steps</Text>
          {[
            'Show QR code to the cashier',
            'Cashier scans and processes payment',
            'Collect your receipt and bags',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueShopping}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#116142', '#0e4a34']}
            style={styles.continueButtonGradient}
          >
            <Ionicons name="cart-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f4ec',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#116142',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  qrLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#116142',
    shadowColor: '#116142',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionIdLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionId: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    maxWidth: 280,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 13,
    color: '#116142',
    fontWeight: '500',
    marginBottom: 14,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  productQty: {
    fontSize: 13,
    color: '#888',
    marginHorizontal: 10,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#ececec',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#116142',
  },
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#116142',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
