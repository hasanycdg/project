import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { session, isLoading } = useAuth();

  // If the user is authenticated, redirect to the main app
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  // If not authenticated, redirect to register
  return <Redirect href="/(auth)/register" />;
}
