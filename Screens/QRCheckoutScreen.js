import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { BarcodeView } from 'rn-barcode-renderer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function QRCheckoutScreen({ route, navigation }) {
  const {
    sessionUuid = '',
    products = [],
    totalAmount = 0,
    storeName = '',
  } = route.params || {};

  const itemCount = products.reduce((sum, p) => sum + (p.quantity || 1), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b3d2e" />

      {/* Header */}
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
        {/* Main barcode card */}
        <View style={styles.barcodeCard}>
          <Text style={styles.readyTitle}>Ready to Checkout</Text>

          {/* Cart summary */}
          <Text style={styles.cartSummary}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} • Total ₹{parseFloat(totalAmount).toFixed(2)}
          </Text>

          {/* Instruction */}
          <Text style={styles.instruction}>Show this barcode to the cashier</Text>

          {/* CODE128 Barcode */}
          <View style={styles.barcodeWrapper}>
            <BarcodeView
              value={sessionUuid || '0000000000'}
              format="CODE128"
              maxWidth={300}
              height={120}
              color="black"
              bgColor="white"
              padding={12}
            />
          </View>

          {/* Session ID fallback */}
          <Text style={styles.sessionIdLabel}>Session ID (manual entry)</Text>
          <Text style={styles.sessionId} numberOfLines={2}>
            {sessionUuid}
          </Text>
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {storeName ? <Text style={styles.storeName}>{storeName}</Text> : null}

          {products.map((item, index) => (
            <View key={index} style={styles.productRow}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productQty}>×{item.quantity || 1}</Text>
              <Text style={styles.productPrice}>
                ₹{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{parseFloat(totalAmount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {[
            'Show barcode to the cashier',
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

        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={20} color="#e53935" style={{ marginRight: 8 }} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
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

  /* Barcode card */
  barcodeCard: {
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
  readyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cartSummary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#116142',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  barcodeWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  sessionIdLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionId: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  /* Summary card */
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
  productName: { flex: 1, fontSize: 14, color: '#333' },
  productQty: { fontSize: 13, color: '#888', marginHorizontal: 10 },
  productPrice: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  divider: { height: 1, backgroundColor: '#ececec', marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#116142' },

  /* Steps card */
  stepsCard: {
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
  stepBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepText: { fontSize: 14, color: '#444', flex: 1 },

  /* Cancel button */
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e53935',
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '700',
  },
});
