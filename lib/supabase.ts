import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use environment variables in a real app
const supabaseUrl = 'https://vfyncyccvstbfapzwmca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeW5jeWNjdnN0YmZhcHp3bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDUxNjksImV4cCI6MjA1NjE4MTE2OX0.YJbsihtqtzHu9EZEbP6IRj2bc_F359b4P3xwh31ZZyo';

// Custom storage implementation for Expo
const ExpoSecureStoreAdapter = Platform.select({
  web: {
    getItem: (key: string) => {
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
    },
  },
  default: {
    getItem: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key) ?? null;
      } catch (error) {
        // Fallback to AsyncStorage if SecureStore fails
        return await AsyncStorage.getItem(key);
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        // Fallback to AsyncStorage if SecureStore fails
        await AsyncStorage.setItem(key, value);
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        // Fallback to AsyncStorage if SecureStore fails
        await AsyncStorage.removeItem(key);
      }
    },
  },
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});