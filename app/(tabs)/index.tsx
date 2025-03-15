import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, FAB, useTheme, IconButton, Modal, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/utils/formatters';
import TransactionList from '@/components/TransactionList';
import type { Transaction, Category } from '@/types';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { transactions, categories, balance } = useData();
  const [greeting, setGreeting] = useState('');
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch notifications
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    // Example: Fetch notifications from local storage or a server
    const storedNotifications = [
      "Did you track your budget today?",
      "Remember to review your expenses!"
    ];
    setNotifications(storedNotifications);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>      
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>        
        <View style={styles.headerTop}>          
          <View>            
            <Text variant="titleLarge" style={[styles.greeting, { color: theme.colors.onPrimary }]}>              
              {greeting}            
            </Text>            
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onPrimary }]}>              
              Welcome back!            
            </Text>          
          </View>          
          <View style={styles.headerActions}>            
            <IconButton              
              icon={() => <Bell size={24} color={theme.colors.surface} />}              
              iconColor={theme.colors.surface}              
              size={24}              
              onPress={() => setNotificationsVisible(true)}            
            />          
          </View>        
        </View>        

        <Card style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>          
          <Card.Content>            
            <Text variant="bodyMedium" style={[styles.balanceLabel, { color: theme.colors.onSurfaceVariant }]}>              
              Total Balance            
            </Text>            
            <Text variant="headlineMedium" style={[styles.balanceAmount, { color: theme.colors.onSurface }]}>              
              {formatCurrency(balance.total)}            
            </Text>            
            <View style={styles.progressBar}>              
              <View                 
                style={[                  
                  styles.progressFill,                  
                  {                     
                    width: `${Math.min((balance.expenses / balance.income) * 100, 100)}%`,                    
                    backgroundColor: theme.colors.error                  
                  }                
                ]}               
              />            
            </View>            
            <View style={styles.balanceDetails}>              
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>                
                Monthly Expenses: {formatCurrency(balance.expenses)}              
              </Text>              
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>                
                {Math.round((balance.expenses / balance.income) * 100)}%              
              </Text>            
            </View>          
          </Card.Content>        
        </Card>      
      </View>      

      <View style={styles.statsContainer}>        
        <Card style={[styles.statsCard, { backgroundColor: theme.colors.primaryContainer }]}>          
          <Card.Content>            
            <Text variant="titleLarge" style={[styles.statsAmount, { color: theme.colors.primary }]}>              
              {formatCurrency(balance.income)}            
            </Text>            
            <Text variant="bodyMedium" style={[styles.statsLabel, { color: theme.colors.onPrimaryContainer }]}>              
              Revenue            
            </Text>          
          </Card.Content>        
        </Card>        

        <Card style={[styles.statsCard, { backgroundColor: theme.colors.errorContainer }]}>          
          <Card.Content>            
            <Text variant="titleLarge" style={[styles.statsAmount, { color: theme.colors.error }]}>              
              {formatCurrency(balance.expenses)}            
            </Text>            
            <Text variant="bodyMedium" style={[styles.statsLabel, { color: theme.colors.onErrorContainer }]}>              
              Expenses            
            </Text>          
          </Card.Content>        
        </Card>      
      </View>      

      <View style={styles.periodSelector}>        
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>          
          Transactions        
        </Text>        
        <Text variant="bodyMedium" style={[styles.periodText, { color: theme.colors.onSurfaceVariant }]}>          
          This Month        
        </Text>      
      </View>      

      <TransactionList         
        transactions={transactions}        
        categories={categories}      
      />      

      <FAB        
        icon="plus"        
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}        
        onPress={() => router.push('/transaction/new')}        
        color={theme.colors.surface}      
      />

      <Portal>
        <Modal visible={notificationsVisible} onDismiss={() => setNotificationsVisible(false)} contentContainerStyle={styles.modalContainer}>
          <Text variant="headlineSmall" style={styles.modalTitle}>Notifications</Text>
          {notifications.length === 0 ? (
            <Text>No notifications available.</Text>
          ) : (
            notifications.map((notification, index) => (
              <Text key={index} style={styles.notificationText}>{notification}</Text>
            ))
          )}
          <Button onPress={() => setNotificationsVisible(false)}>Close</Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greeting: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  balanceLabel: {
    opacity: 0.8,
  },
  balanceAmount: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statsAmount: {
    fontWeight: 'bold',
  },
  statsLabel: {
    marginTop: 4,
    opacity: 0.8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  periodText: {
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  notificationText: {
    marginBottom: 8,
  },
});