import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const NOTIFICATION_SETTINGS_KEY = 'budgetBuddy_notificationsEnabled';
const NOTIFICATION_HOUR = 20; // 8 PM
const NOTIFICATION_MINUTE = 0;
// Global timer reference to manage the notification interval
let globalTimerRef: NodeJS.Timeout | null = null;

/**
 * NotificationCenter component that handles daily budget reminder notifications
 * This implementation uses a timer-based approach to check if it's 8 PM
 * and logs that a notification would be sent (actual notifications will be
 * implemented when expo-notifications is properly installed)
 */
export default function NotificationCenter() {
  const componentIsMounted = useRef(true);

  useEffect(() => {
    // Set up notifications when the component mounts
    const setupNotifications = async () => {
      console.log('Setting up notification system...');
      await checkNotificationPermissions();
      await setupDailyBudgetReminder();
    };
    
    setupNotifications();

    // Clean up function
    return () => {
      componentIsMounted.current = false;
      if (globalTimerRef) {
        clearInterval(globalTimerRef);
        globalTimerRef = null;
      }
    };
  }, []);

  // No UI is rendered
  return null;
}

/**
 * Check if notification permissions are granted
 * This is a mock implementation until expo-notifications is properly installed
 */
async function checkNotificationPermissions() {
  try {
    console.log('Checking notification permissions');
    // In a real implementation with expo-notifications, this would check and request permissions
    return true;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Set up the daily budget reminder notification
 * Checks if notifications are enabled and starts the timer if they are
 */
async function setupDailyBudgetReminder() {
  try {
    // Check if notifications are enabled in settings
    const isEnabled = await areNotificationsEnabled();
    
    if (isEnabled) {
      console.log('Daily budget reminders are enabled - starting timer');
      startDailyNotificationTimer();
    } else {
      console.log('Daily budget reminders are disabled');
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
}

/**
 * Start a timer that checks if it's time to send the notification
 * The timer checks every minute if it's 8 PM and sends a notification if it is
 */
function startDailyNotificationTimer() {
  // Check every minute if it's time to send the notification
  const timer = setInterval(async () => {
    const isEnabled = await areNotificationsEnabled();
    if (!isEnabled) {
      clearInterval(timer);
      return;
    }
    
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // If it's 8:00 PM (20:00), log that we would send a notification
    if (hour === NOTIFICATION_HOUR && minute === NOTIFICATION_MINUTE) {
      console.log('It is 8:00 PM - sending budget reminder notification');
      sendMockNotification();
    }
  }, 60000); // Check every minute
  
  // Store the timer reference so we can clear it if needed
  if (globalTimerRef) {
    clearInterval(globalTimerRef);
  }
  globalTimerRef = timer;
}

/**
 * Send a mock notification (since we don't have expo-notifications yet)
 */
function sendMockNotification() {
  console.log('NOTIFICATION: Budget Reminder - Did you track your expenses or incomes for today?');
  // This would be replaced with actual notification code when expo-notifications is available
}

/**
 * Toggle notification settings on or off
 * @param enabled Whether notifications should be enabled
 * @returns Whether the operation was successful
 */
export async function toggleNotifications(enabled: boolean) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, enabled ? 'true' : 'false');
    
    if (enabled) {
      console.log('Notifications enabled');
      await setupDailyBudgetReminder();
    } else {
      console.log('Notifications disabled');
      // Would cancel scheduled notifications here if using expo-notifications
      if (globalTimerRef) {
        clearInterval(globalTimerRef);
        globalTimerRef = null;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling notifications:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 * @returns Whether notifications are enabled
 */
export async function areNotificationsEnabled() {
  try {
    const notificationsEnabled = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    // Default to true if not set (enabled by default when app is first installed)
    return notificationsEnabled !== 'false';
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled
  }
}
