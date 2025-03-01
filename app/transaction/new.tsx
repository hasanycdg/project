import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, SegmentedButtons, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';
import { renderIcon } from '@/utils/iconUtils';

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'dollar-sign' },
  { name: 'Freelance Income', type: 'income', icon: 'briefcase' },
  { name: 'Investment Returns', type: 'income', icon: 'piggy-bank' },
  { name: 'Other Income', type: 'income', icon: 'wallet' },
  { name: 'Food & Dining', type: 'expense', icon: 'utensils' },
  { name: 'Transportation', type: 'expense', icon: 'car' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-cart' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'zap' },
  { name: 'Entertainment', type: 'expense', icon: 'film' },
  { name: 'Health', type: 'expense', icon: 'heart' },
  { name: 'Travel', type: 'expense', icon: 'plane' },
  { name: 'Other', type: 'expense', icon: 'tag' }
];

export default function NewTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const createDefaultCategories = async () => {
    if (!session?.user?.id) return;
    
    try {
      // First check if user has any categories
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      // Only create default categories if user has none
      if (!existingCategories?.length) {
        const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => {
          // Create category data with required fields
          const categoryData: any = {
            user_id: session.user.id,
            name: cat.name,
            type: cat.type
          };
          
          // Add icon field if supported by the database
          try {
            if (cat.icon) {
              categoryData.icon = cat.icon;
            }
          } catch (e) {
            console.log('Icon field not supported yet');
          }
          
          return categoryData;
        });

        const { error } = await supabase
          .from('categories')
          .insert(categoriesToInsert);

        if (error) throw error;
        
        // Fetch categories again after creating defaults
        await fetchCategories();
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      createDefaultCategories();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCategories();
    }
  }, [session?.user?.id, type]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('type', type);

      if (error) throw error;
      setCategories(data || []);
      // Select first category by default
      if (data && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.id || !amount || !description || !selectedCategory) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          amount: parseFloat(amount),
          description,
          type,
          category_id: selectedCategory,
          date: new Date().toISOString(),
        });

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          New Transaction
        </Text>

        <SegmentedButtons
          value={type}
          onValueChange={(value) => {
            setType(value);
            setSelectedCategory('');
          }}
          buttons={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          style={styles.segment}
        />

        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
        />

        <Text variant="titleMedium" style={[styles.categoryTitle, { color: theme.colors.onBackground }]}>
          Category
        </Text>

        {categories.map((category) => (
          <List.Item
            key={category.id}
            title={category.name}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            titleStyle={{
              color: selectedCategory === category.id
                ? theme.colors.onPrimaryContainer
                : theme.colors.onBackground,
            }}
            left={props => (
              <View style={styles.iconContainer}>
                {category.icon && renderIcon(category.icon, {
                  size: 24,
                  color: selectedCategory === category.id
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                })}
                {selectedCategory === category.id && (
                  <View style={[styles.checkIndicator, { backgroundColor: theme.colors.primary }]} />
                )}
              </View>
            )}
          />
        ))}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !amount || !description || !selectedCategory}
          style={styles.button}
        >
          Create Transaction
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  segment: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  categoryTitle: {
    marginBottom: 8,
  },
  categoryItem: {
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  button: {
    marginTop: 24,
  },
});
