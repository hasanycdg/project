import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import TransactionList from '@/components/TransactionList';
import type { Transaction } from '@/types';

export default function Calendar() {
  const theme = useTheme();
  const { transactions, categories } = useData();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by latest first
      .reduce<Record<string, Transaction[]>>((groups, transaction) => {
        const date = format(new Date(transaction.date), 'yyyy-MM-dd');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
      }, {});
  };

  const getDailyTotal = (dayTransactions: Transaction[]) => {
    return dayTransactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') {
          acc.income += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.expenses += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );
  };

  const getMarkedDates = () => {
    const groupedTransactions = groupTransactionsByDate(transactions);
    const markedDates: Record<string, { marked: boolean; dotColor: string }> = {};

    Object.entries(groupedTransactions).forEach(([date, dayTransactions]) => {
      const total = getDailyTotal(dayTransactions);
      markedDates[date] = {
        marked: true,
        dotColor: total.balance >= 0 ? theme.colors.primary : theme.colors.error,
      };
    });

    if (selectedDate) {
      markedDates[selectedDate] = {
        ...(markedDates[selectedDate] || { marked: false }),
        selected: true,
        selectedColor: theme.colors.primaryContainer,
      };
    }

    return markedDates;
  };

  const selectedDayTransactions = transactions.filter(
    t => format(new Date(t.date), 'yyyy-MM-dd') === selectedDate
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dailyTotal = getDailyTotal(selectedDayTransactions);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <RNCalendar
          style={styles.calendar}
          theme={{
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.onSurface,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.onPrimary,
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.onSurface,
            textDisabledColor: theme.colors.onSurfaceDisabled,
            monthTextColor: theme.colors.onSurface,
            arrowColor: theme.colors.primary,
          }}
          markedDates={getMarkedDates()}
          onDayPress={handleDayPress}
        />

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Income</Text>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {formatCurrency(dailyTotal.income)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Expenses</Text>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.error }}
                >
                  {formatCurrency(dailyTotal.expenses)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Balance</Text>
                <Text
                  variant="titleMedium"
                  style={{ color: dailyTotal.balance >= 0 ? theme.colors.primary : theme.colors.error }}
                >
                  {formatCurrency(dailyTotal.balance)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <TransactionList 
          transactions={selectedDayTransactions}
          categories={categories}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  calendar: {
    marginBottom: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
});
