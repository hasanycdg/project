import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, FAB, useTheme, IconButton } from 'react-native-paper';
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

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
              onPress={() => {}}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceCard: {
    borderRadius: 16,
    elevation: 4,
  },
  balanceLabel: {
    marginBottom: 8,
  },
  balanceAmount: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -16,
    paddingHorizontal: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
  },
  statsAmount: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    opacity: 0.7,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  periodText: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});