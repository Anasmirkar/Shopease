import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_CONFIG } from '../config';

const { width, height } = Dimensions.get('window');

export default function UserProfileSlideBar({ 
  isVisible, 
  onClose, 
  user, 
  selectedStore,
  onLogout
}) {
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      fetchShoppingHistory();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const fetchShoppingHistory = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SHOPPING_HISTORY}/${user._id}`);
      const data = await response.json();
      if (data.history) {
        setShoppingHistory(data.history);
      }
    } catch (error) {
      console.log('Network error - server might be offline:', error.message);
      // Don't show error alert as it's not critical for app functionality
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.slideBar,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#0b3d2e', '#0e4a34', '#116142']}
          style={styles.slideBarGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* User Info Section */}
            <View style={styles.userSection}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.userCard}
              >
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.name || user?.username || 'User'}</Text>
                  <Text style={styles.userPhone}>{user?.phone || 'N/A'}</Text>
                  {selectedStore && (
                    <Text style={styles.userStore}>📍 {selectedStore.name}</Text>
                  )}
                      {/* <Text style={styles.debugText}>Debug: {JSON.stringify(user)}</Text> */}
                </View>
              </LinearGradient>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutSection}>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={() => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Logout', 
                        style: 'destructive',
                        onPress: () => {
                          onClose();
                          setTimeout(() => {
                            onLogout && onLogout();
                          }, 300);
                        }
                      }
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  style={styles.logoutButtonGradient}
                >
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Shopping History Section */}
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt" size={20} color="#fff" />
                <Text style={styles.sectionTitle}>Shopping History</Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4ECDC4" />
                  <Text style={styles.loadingText}>Loading history...</Text>
                </View>
              ) : shoppingHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="receipt-outline" size={60} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyHistoryText}>No shopping history yet</Text>
                  <Text style={styles.emptyHistorySubtext}>Your purchases will appear here</Text>
                </View>
              ) : (
                <View style={styles.historyList}>
                  {shoppingHistory.map((transaction, index) => (
                    <View key={transaction._id} style={styles.historyItem}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.historyItemGradient}
                      >
                        <View style={styles.historyHeader}>
                          <Text style={styles.receiptNumber}>
                            #{transaction.receiptNumber}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {formatDate(transaction.date)}
                          </Text>
                        </View>
                        
                        <View style={styles.historyDetails}>
                          <Text style={styles.transactionTime}>
                            {formatTime(transaction.time)}
                          </Text>
                          {transaction.storeName && (
                            <Text style={styles.storeName}>
                              🏪 {transaction.storeName}
                            </Text>
                          )}
                        </View>

                        <View style={styles.historyItems}>
                          <Text style={styles.itemsCount}>
                            {transaction.products.length} item(s)
                          </Text>
                          <Text style={styles.totalAmount}>
                            ₹{transaction.totalAmount.toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.paymentMethod}>
                          <Ionicons 
                            name={
                              transaction.paymentMethod === 'Cash' ? 'cash' :
                              transaction.paymentMethod === 'GPay' ? 'phone-portrait' :
                              transaction.paymentMethod === 'UPI' ? 'qr-code' :
                              transaction.paymentMethod === 'ATM Card' ? 'card' :
                              'globe'
                            } 
                            size={16} 
                            color="#4ECDC4" 
                          />
                          <Text style={styles.paymentText}>
                            {transaction.paymentMethod}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  slideBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.85,
    height: height,
    zIndex: 1001,
  },
  slideBarGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  userCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  userStore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  debugText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 5,
  },
  historySection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
    fontSize: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 15,
    fontWeight: '500',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 5,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItemGradient: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  transactionDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  storeName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  historyItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  logoutSection: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
