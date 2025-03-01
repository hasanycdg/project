import { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, useTheme, Avatar, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isSameMonth, subMonths } from 'date-fns';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/utils/formatters';
import type { Transaction, Category } from '@/types';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

const PREDEFINED_QUESTIONS = [
  {
    id: 'total-expenses',
    text: 'What are my total expenses?',
    handler: (transactions: Transaction[]) => {
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return `Your total expenses are ${formatCurrency(totalExpenses)}.`;
    }
  },
  {
    id: 'highest-expense',
    text: 'Which category did I spend the most on?',
    handler: (transactions: Transaction[], categories: Category[]) => {
      const categoryTotals = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
          acc[curr.category_id] = (acc[curr.category_id] || 0) + curr.amount;
          return acc;
        }, {} as Record<string, number>);

      const highestCategoryId = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      if (!highestCategoryId) return "You don't have any expenses yet.";

      const categoryName = categories.find(c => c.id === highestCategoryId)?.name || 'Unknown';
      const amount = categoryTotals[highestCategoryId];

      return `Your highest expense category is ${categoryName} with ${formatCurrency(amount)}.`;
    }
  },
  {
    id: 'monthly-comparison',
    text: 'How do my expenses compare to last month?',
    handler: (transactions: Transaction[]) => {
      const now = new Date();
      const currentMonth = transactions
        .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), now))
        .reduce((sum, t) => sum + t.amount, 0);

      const lastMonth = transactions
        .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), subMonths(now, 1)))
        .reduce((sum, t) => sum + t.amount, 0);

      const difference = currentMonth - lastMonth;
      const percentChange = lastMonth ? (difference / lastMonth) * 100 : 0;

      if (difference > 0) {
        return `Your expenses this month (${formatCurrency(currentMonth)}) are ${formatCurrency(difference)} higher than last month (${formatCurrency(lastMonth)}). That's a ${Math.abs(Math.round(percentChange))}% increase.`;
      } else if (difference < 0) {
        return `Your expenses this month (${formatCurrency(currentMonth)}) are ${formatCurrency(Math.abs(difference))} lower than last month (${formatCurrency(lastMonth)}). That's a ${Math.abs(Math.round(percentChange))}% decrease.`;
      } else {
        return `Your expenses this month (${formatCurrency(currentMonth)}) are the same as last month.`;
      }
    }
  },
  {
    id: 'largest-expense',
    text: 'What was my largest expense?',
    handler: (transactions: Transaction[], categories: Category[]) => {
      const largestExpense = transactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)[0];

      if (!largestExpense) return "You don't have any recorded expenses yet.";

      const categoryName = categories.find(c => c.id === largestExpense.category_id)?.name || 'Unknown';
      return `Your largest expense was ${formatCurrency(largestExpense.amount)} for ${largestExpense.description} in the ${categoryName} category on ${format(new Date(largestExpense.date), 'MMMM d')}.`;
    }
  },
  {
    id: 'income-sources',
    text: 'What are my income sources?',
    handler: (transactions: Transaction[], categories: Category[]) => {
      const incomeByCategory = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => {
          acc[curr.category_id] = (acc[curr.category_id] || 0) + curr.amount;
          return acc;
        }, {} as Record<string, number>);

      const incomeSources = Object.entries(incomeByCategory)
        .map(([categoryId, amount]) => ({
          name: categories.find(c => c.id === categoryId)?.name || 'Unknown',
          amount
        }))
        .sort((a, b) => b.amount - a.amount);

      if (incomeSources.length === 0) return "You don't have any recorded income yet.";

      return `Your income sources:\n` +
        incomeSources.map(source => 
          `• ${source.name}: ${formatCurrency(source.amount)}`
        ).join('\n');
    }
  },
  {
    id: 'savings-trend',
    text: 'How are my savings trending?',
    handler: (transactions: Transaction[]) => {
      const now = new Date();
      const months = Array.from({ length: 3 }, (_, i) => subMonths(now, i));
      
      const monthlySavings = months.map(month => {
        const monthTransactions = transactions.filter(t => isSameMonth(new Date(t.date), month));
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          month: format(month, 'MMMM'),
          savings: income - expenses
        };
      });

      const trend = monthlySavings[0].savings > monthlySavings[1].savings ? 'increasing' : 'decreasing';
      const latestSavings = monthlySavings[0].savings;
      
      return `Your savings are ${trend}. In ${monthlySavings[0].month}, you saved ${formatCurrency(Math.max(0, latestSavings))}${latestSavings < 0 ? ' (negative savings)' : ''}.`;
    }
  }
];

export default function ChatScreen() {
  const theme = useTheme();
  const { transactions, categories } = useData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your financial advisor. Choose a question below to get insights about your finances.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleQuestionSelect = async (question: typeof PREDEFINED_QUESTIONS[0]) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question.text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = question.handler(transactions, categories);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error handling question:', error);
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
        { backgroundColor: item.isUser ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
      ]}
    >
      {!item.isUser && (
        <Avatar.Icon
          size={24}
          icon="robot"
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        />
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.messageText,
            {
              color: item.isUser
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            {
              color: item.isUser
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
              opacity: 0.7,
            },
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>
            Analyzing your finances...
          </Text>
        </View>
      )}

      <View style={[styles.questionsContainer, { backgroundColor: theme.colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.questionsScroll}
        >
          {PREDEFINED_QUESTIONS.map(question => (
            <Chip
              key={question.id}
              mode="outlined"
              onPress={() => handleQuestionSelect(question)}
              style={styles.questionChip}
              disabled={isLoading}
            >
              {question.text}
            </Chip>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  questionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  questionsScroll: {
    paddingRight: 8,
    gap: 8,
  },
  questionChip: {
    marginRight: 8,
  },
});
