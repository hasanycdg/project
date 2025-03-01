import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const { requiresEmailConfirmation } = await signUp(email, password, fullName);
      
      if (requiresEmailConfirmation) {
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Text variant="headlineSmall" style={styles.messageTitle}>Check your email!</Text>
          <Text variant="bodyLarge" style={styles.messageText}>
            We've sent you an email to confirm your account. Please check your inbox and follow the instructions.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/login')}
            style={styles.button}
          >
            Go to Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text variant="displaySmall" style={styles.appName}>BudgetBuddy</Text>
        <Text variant="bodyLarge" style={styles.tagline}>Create your account</Text>
      </View>

      <View style={styles.formContainer}>
        {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}
        
        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />
        
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />
        
        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          style={styles.button}
        >
          Sign Up
        </Button>
        
        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Link href="/login" asChild>
            <Button mode="text" compact>Sign In</Button>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  messageText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    color: '#666',
  },
  formContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
});