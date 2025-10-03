import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Dimensions, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../supabaseClient';
import * as Device from 'expo-device';
import { GOOGLE_AUTH_CONFIG } from '../config';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [loading, setLoading] = React.useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
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
  const [request, response, promptAsync] = Google.useAuthRequest(GOOGLE_AUTH_CONFIG);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      signInWithSupabase(authentication.accessToken);
    }
  }, [response]);

  // Select user from users table as per schema
  const signInWithSupabase = async (accessToken) => {
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
      Alert.alert('Login Failed', 'Could not fetch Google user info.');
      return;
    }
    // Select user from users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userInfo.email)
      .single();
    setLoading(false);
    if (error || !data) {
      Alert.alert('Login Failed', error?.message || 'User not found. Please sign up.');
    } else {
      onLoginSuccess && onLoginSuccess(data);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    let deviceId = null;
    try {
      deviceId = Device.osInternalBuildId || Device.deviceName || Device.modelId || Device.osBuildId || Math.random().toString(36).substring(2, 15);
    } catch (e) {
      deviceId = Math.random().toString(36).substring(2, 15);
    }
    // First try to find existing guest record
    let { data, error } = await supabase
      .from('guests')
      .select()
      .eq('device_id', deviceId)
      .single();
    
    // If no existing record found, create new one
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
      Alert.alert('Guest Login Failed', error.message);
    } else {
      onLoginSuccess && onLoginSuccess({ guest: true, ...data });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputAnim, {
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
            <Ionicons name="scan" size={48} color="#fff" />
          </Animated.View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing In...' : 'Sign in with Google'}
            </Text>
            <Ionicons name="logo-google" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.guestButton]}
            onPress={handleGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>Continue as Guest</Text>
            <Ionicons name="person" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
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
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  guestButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  signupLink: {
    alignItems: 'center',
  },
  signupTextBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
