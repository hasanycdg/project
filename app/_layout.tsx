import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Import NotificationCenter using the @/ alias to avoid path resolution issues
import NotificationCenter from '@/components/NotificationCenter';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useEffect(() => {
    window.frameworkReady?.();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <PaperProvider theme={theme}>
            <NotificationCenter />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            <StatusBar style="auto" />
          </PaperProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}