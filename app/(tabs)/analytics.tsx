import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, Surface, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/utils/formatters';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, subDays, isSameMonth } from 'date-fns';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { calculateMonthlyStats } from '@/utils/financialForecasting';
import type { Transaction } from '@/types';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const theme = useTheme();
  const { transactions, categories } = useData();
  const [selectedView, setSelectedView] = React.useState('overview');

  // Helper function to get chart config
  const getChartConfig = (withGrid = true) => ({
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.onSurface + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurface + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeWidth: withGrid ? '1' : '0',
    },
  });

  // Calculate quick stats
  const getQuickStats = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    );

    const income = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    return { income, expenses, savings, savingsRate };
  };

  // Calculate income sources
  const getIncomeSourcesData = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const incomeSources = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
      .reduce((acc, curr) => {
        const category = categories.find(c => c.id === curr.category_id);
        const name = category?.name || 'Other';
        acc[name] = (acc[name] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.tertiary,
      '#4DB6AC',
      '#7986CB',
      '#FFB74D',
    ];

    return Object.entries(incomeSources)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index % colors.length],
        legendFontColor: theme.colors.onSurface,
      }));
  };

  // Calculate expense categories
  const getExpenseCategoriesData = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const expenseCategories = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
      .reduce((acc, curr) => {
        const category = categories.find(c => c.id === curr.category_id);
        const name = category?.name || 'Other';
        acc[name] = (acc[name] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const colors = [
      theme.colors.error,
      '#FF8A65',
      '#4DB6AC',
      '#7986CB',
      '#DCE775',
      '#FFB74D',
    ];

    return Object.entries(expenseCategories)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index % colors.length],
        legendFontColor: theme.colors.onSurface,
      }));
  };

  // Calculate monthly trends
  const getMonthlyTrends = () => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    const monthlyData = months.map(month => {
      const monthTransactions = transactions.filter(t => 
        isSameMonth(new Date(t.date), month)
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return { month, income, expenses };
    }).reverse();

    return {
      labels: monthlyData.map(d => format(d.month, 'MMM')),
      datasets: [
        {
          data: monthlyData.map(d => d.income),
          color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
          strokeWidth: 2,
        },
        {
          data: monthlyData.map(d => d.expenses),
          color: (opacity = 1) => theme.colors.error + Math.round(opacity * 255).toString(16),
          strokeWidth: 2,
        },
      ],
      legend: ['Income', 'Expenses'],
    };
  };

  // Calculate daily income pattern
  const getDailyIncomePattern = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const dailyTotals = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
      .reduce((acc, curr) => {
        const day = new Date(curr.date).getDay();
        acc[day] = (acc[day] || 0) + curr.amount;
        return acc;
      }, {} as Record<number, number>);

    const data = daysOfWeek.map((_, i) => dailyTotals[i] || 0);
    const maxAmount = Math.max(...data);

    return {
      labels: daysOfWeek.map(day => day.slice(0, 3)),
      datasets: [{
        data: data.map(amount => Math.round((amount / maxAmount) * 100)),
      }],
    };
  };

  const quickStats = getQuickStats();
  const monthlyTrends = getMonthlyTrends();
  const incomeSourcesData = getIncomeSourcesData();
  const expenseCategoriesData = getExpenseCategoriesData();
  const dailyIncomePattern = getDailyIncomePattern();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>30-Day Income</Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              {formatCurrency(quickStats.income)}
            </Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer }}>30-Day Expenses</Text>
            <Text variant="headlineMedium" style={{ color: theme.colors.onErrorContainer }}>
              {formatCurrency(quickStats.expenses)}
            </Text>
          </Surface>
        </View>

        <Surface style={[styles.savingsCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            Savings Rate
          </Text>
          <Text variant="displaySmall" style={{ color: theme.colors.onSecondaryContainer }}>
            {Math.round(quickStats.savingsRate)}%
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            {formatCurrency(quickStats.savings)} saved this month
          </Text>
        </Surface>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.cardTitle}>6-Month Trends</Text>
            <Text variant="bodyMedium" style={styles.chartCaption}>
              Monthly income and expenses
            </Text>
            <LineChart
              data={monthlyTrends}
              width={screenWidth - 60}
              height={220}
              chartConfig={getChartConfig()}
              bezier
              style={styles.chart}
              fromZero
              yAxisLabel="$"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.cardTitle}>Income Sources</Text>
            <Text variant="bodyMedium" style={styles.chartCaption}>
              Distribution of income by category
            </Text>
            <PieChart
              data={incomeSourcesData}
              width={screenWidth - 60}
              height={220}
              chartConfig={getChartConfig()}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.cardTitle}>Expense Categories</Text>
            <Text variant="bodyMedium" style={styles.chartCaption}>
              Distribution of expenses by category
            </Text>
            <PieChart
              data={expenseCategoriesData}
              width={screenWidth - 60}
              height={220}
              chartConfig={getChartConfig()}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.cardTitle}>Income Pattern</Text>
            <Text variant="bodyMedium" style={styles.chartCaption}>
              Relative income by day of week (%)
            </Text>
            <BarChart
              data={dailyIncomePattern}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                ...getChartConfig(),
                barPercentage: 0.7,
                propsForLabels: {
                  fontSize: '12',
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisSuffix="%"
              horizontalLabelRotation={-45}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  savingsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardContent: {
    paddingHorizontal: 8,
  },
  cardTitle: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  chartCaption: {
    marginBottom: 16,
    opacity: 0.7,
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
