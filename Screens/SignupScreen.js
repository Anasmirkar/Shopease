// ...existing code...
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../supabaseClient';
import * as Device from 'expo-device';

export default function SignupScreen({ navigation }) {
  const [loading, setLoading] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const nameInputAnim = useRef(new Animated.Value(0)).current;
  const phoneInputAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Google Auth
  const { GOOGLE_AUTH_CONFIG } = require('../config');
  const [request, response, promptAsync] = Google.useAuthRequest(GOOGLE_AUTH_CONFIG);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      signUpWithSupabase(authentication.accessToken);
    }
  }, [response]);

  // Insert user into users table as per schema
  const signUpWithSupabase = async (accessToken) => {
    setLoading(true);
    // Get user info from Google token
    let userInfo = null;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      userInfo = await res.json();
    } catch (e) {}
    if (!userInfo || !userInfo.email) {
      setLoading(false);
      Alert.alert('Signup Failed', 'Could not fetch Google user info.');
      return;
    }
    // Insert or upsert user in users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email: userInfo.email,
        name: userInfo.name || '',
        phone_number: userInfo.phone_number || '',
        otp_verified: true
      }, { onConflict: ['email'] })
      .select()
      .single();
    setLoading(false);
    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      navigation.navigate('Main', { user: data });
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    let deviceId;
    try {
      deviceId = Device.osInternalBuildId || Device.deviceName || Device.modelId || Device.osBuildId || Math.random().toString(36).substring(2, 15);
    } catch {
      deviceId = Math.random().toString(36).substring(2, 15);
    }

    const proceedAsLocalGuest = () => {
      setLoading(false);
      navigation.navigate('SelectStore', { guest: true, id: deviceId, device_id: deviceId });
    };

    try {
      let { data, error } = await supabase
        .from('guests')
        .select()
        .eq('device_id', deviceId)
        .single();

      if (error && error.code === 'PGRST116') {
        const insertResult = await supabase
          .from('guests')
          .insert([{ device_id: deviceId }])
          .select()
          .single();
        data = insertResult.data;
        error = insertResult.error;
      }

      setLoading(false);
      if (error) {
        console.warn('Guest DB error, continuing locally:', error.message);
        navigation.navigate('SelectStore', { guest: true, id: deviceId, device_id: deviceId });
      } else {
        navigation.navigate('SelectStore', { guest: true, ...data });
      }
    } catch (networkErr) {
      setLoading(false);
      Alert.alert(
        'Cannot connect to server',
        'Check your internet connection. You can still continue as a guest.',
        [
          { text: 'Continue as Guest', onPress: proceedAsLocalGuest },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleNameFocus = () => {
    setNameFocused(true);
    Animated.timing(nameInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleNameBlur = () => {
    setNameFocused(false);
    Animated.timing(nameInputAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePhoneFocus = () => {
    setPhoneFocused(true);
    Animated.timing(phoneInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePhoneBlur = () => {
    setPhoneFocused(false);
    Animated.timing(phoneInputAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={['#0b3d2e', '#0e4a34', '#116142']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  {
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                  {
                    rotate: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-15deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="person-add" size={48} color="#fff" />
          </Animated.View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us today</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.signupButtonText}>
              {loading ? 'Signing Up...' : 'Sign up with Google'}
            </Text>
            <Ionicons name="logo-google" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signupButton, styles.guestButton]}
            onPress={handleGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.signupButtonText}>Continue as Guest</Text>
            <Ionicons name="person" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  backButton: {
    position: 'absolute',
    top: -50,
    left: -30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 22,
    paddingVertical: 17,
    marginBottom: 22,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#fff',
  },
  signupButton: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 25,
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  guestButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
});