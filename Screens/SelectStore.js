import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

const StoreSelectionScreen = ({ navigation }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [chosenStore, setChosenStore] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*');
      if (error) {
        setError('Failed to load stores');
        setStores([]);
      } else {
        setStores(data);
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

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

  const handleStoreSelect = (store) => {
    setChosenStore(store);
    setWelcomeVisible(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setWelcomeVisible(false);
        navigation.navigate('MainApp', { selectedStore: store });
      }, 2200);
    });
  };

  const StoreRow = ({ store, index, onPress }) => {
    const rowAnim = new Animated.Value(20);
    const opacityAnim = new Animated.Value(0);
    useEffect(() => {
      Animated.parallel([
        Animated.timing(rowAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      ]).start();
    }, []);

    // Determine if this is a demo store
    const isDemo = store.name.toLowerCase().includes('demo');
    // Get appropriate icon based on store name
    const getStoreIcon = (storeName) => {
      if (storeName.toLowerCase().includes('demo')) return '🛒';
      if (storeName.toLowerCase().includes('walmart')) return '🏪';
      if (storeName.toLowerCase().includes('target')) return '🏪';
      if (storeName.toLowerCase().includes('kroger')) return '🏪';
      return '🏪';
    };
    
    // Get store distance/info
    const getStoreInfo = (store) => {
      if (store.name.toLowerCase().includes('demo')) return 'Experience Scanto';
      return store.address; // Just return address, no distance
    };

    return (
      <Animated.View style={{ transform: [{ translateY: rowAnim }], opacity: opacityAnim }}>
        <TouchableOpacity
          style={[styles.storeCard, isDemo && styles.demoStoreCard]}
          onPress={() => onPress(store)}
          activeOpacity={0.8}
        >
          <View style={[styles.storeIconContainer, isDemo && styles.demoIconContainer]}>
            <Text style={styles.storeIcon}>{getStoreIcon(store.name)}</Text>
          </View>
          <View style={styles.storeInfo}>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName}>{store.name}</Text>
              {isDemo && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO</Text>
                </View>
              )}
            </View>
            <View style={styles.storeLocationRow}>
              <Icon name="location-on" size={14} color="#666" style={styles.locationIcon} />
              <Text style={styles.storeAddress}>
                {isDemo ? 'Experience Scanto' : store.address}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading stores...</Text></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.whiteBackground}>
        {welcomeVisible && (
          <View style={styles.welcomeOverlay}>
            <Animated.View style={[styles.welcomeCard, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.welcomeTitle}>Welcome to {chosenStore?.name}</Text>
              <Text style={styles.welcomeSub}>Happy Shopping!</Text>
            </Animated.View>
          </View>
        )}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Green Header */}
          <View style={styles.greenHeader}>
            <Text style={styles.headerTitle}>Choose Your Store</Text>
            <Text style={styles.headerSubtitle}>Select a participating store to start shopping</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.whiteBackground}
          >
            {/* Store Selection */}
            <Animated.View
              style={[
                styles.storesSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {stores.map((s, i) => (
                <StoreRow key={s.id} store={s} index={i} onPress={handleStoreSelect} />
              ))}
              <Text style={styles.moreComing}>More stores coming soon...</Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Green Header Section
  greenHeader: {
    backgroundColor: '#116142',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  whiteBackground: {
    backgroundColor: '#fff',
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  storesSection: {
    marginTop: 0,
  },
  // Store Card Styles
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  demoStoreCard: {
    borderColor: '#FDB241',
    borderWidth: 2,
  },
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  demoIconContainer: {
    backgroundColor: '#FDB241',
  },
  storeIcon: {
    fontSize: 24,
  },
  storeInfo: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  demoBadge: {
    backgroundColor: '#FDB241',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  storeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
  },
  moreComing: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
  // Welcome overlay styles
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  welcomeSub: {
    marginTop: 6,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
});

export default StoreSelectionScreen;