import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Transaction, Category } from '@/types';

interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  balance: {
    total: number;
    income: number;
    expenses: number;
  };
  refreshData: () => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balance, setBalance] = useState({ total: 0, income: 0, expenses: 0 });

  const calculateBalance = (transactions: Transaction[]) => {
    const result = transactions.reduce(
      (acc, transaction) => {
        const amount = transaction.amount;
        if (transaction.type === 'income') {
          acc.income += amount;
          acc.total += amount;
        } else {
          acc.expenses += amount;
          acc.total -= amount;
        }
        return acc;
      },
      { total: 0, income: 0, expenses: 0 }
    );
    setBalance(result);
  };

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
      calculateBalance(transactionsData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // Update local state to avoid waiting for subscription
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === id 
            ? { ...transaction, ...updates } 
            : transaction
        )
      );
      
      // Recalculate balance
      calculateBalance(
        transactions.map(transaction => 
          transaction.id === id 
            ? { ...transaction, ...updates } 
            : transaction
        )
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // Update local state to avoid waiting for subscription
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      
      // Recalculate balance
      calculateBalance(updatedTransactions);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();

      // Subscribe to changes in transactions
      const transactionsSubscription = supabase
        .channel('transactions-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      // Subscribe to changes in categories
      const categoriesSubscription = supabase
        .channel('categories-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        transactionsSubscription.unsubscribe();
        categoriesSubscription.unsubscribe();
      };
    }
  }, [session?.user?.id]);

  return (
    <DataContext.Provider 
      value={{ 
        transactions, 
        categories, 
        balance, 
        refreshData: fetchData,
        updateTransaction,
        deleteTransaction
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
