import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton, Modal, Portal, Button, TextInput, SegmentedButtons, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';
import { useData } from '@/context/DataContext';
import { ShoppingBag, DollarSign, Home, Car, Coffee, Gift, Heart, Plane, MoreVertical, Trash2, Edit3, LucideProps, CreditCard, Tag, Briefcase, TrendingUp, Wrench } from 'lucide-react-native';
import type { Transaction, Category } from '@/types';

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

// Interface for grouped transactions
interface GroupedTransactions {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  transactions: Transaction[];
}

// Type for Lucide icon components
type IconComponent = React.ComponentType<LucideProps>;

// Function to get the appropriate icon for a category
function getCategoryIcon(categoryName: string): IconComponent {
  switch (categoryName.toLowerCase()) {
    case 'food & dining':
      return Coffee;
    case 'transportation':
      return Car;
    case 'shopping':
      return ShoppingBag;
    case 'bills & utilities':
      return CreditCard;
    case 'health':
      return Heart;
    case 'other':
      return Tag;
    case 'car':
      return Car;
    case 'salary':
      return DollarSign;
    case 'freelance income':
      return Briefcase;
    case 'investment returns':
      return TrendingUp;
    case 'other income':
      return Tag;
    case 'papa':
      return Wrench;
    case 'girlfriend':
      return Heart;
    case 'travel':
      return Plane;
    default:
      return Tag;
  }
}

export default function TransactionList({ transactions, categories }: Props): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { refreshData, updateTransaction, deleteTransaction } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedCategoryId, setEditedCategoryId] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Group by date
    sortedTransactions.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0]; // Get YYYY-MM-DD part
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });
    
    // Convert to array format for SectionList
    return Object.keys(groups).map(date => {
      const dateObj = parseISO(date);
      return {
        date,
        formattedDate: format(dateObj, 'MMM dd'),
        dayOfWeek: format(dateObj, 'EEEE'),
        transactions: groups[date]
      };
    });
  }, [transactions]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const openEditModal = (transaction: Transaction): void => {
    setSelectedTransaction(transaction);
    setEditedDescription(transaction.description);
    setEditedAmount(transaction.amount.toString());
    setEditedType(transaction.type);
    setEditedCategoryId(transaction.category_id);
    setEditModalVisible(true);
  };

  const handleUpdateTransaction = async (): Promise<void> => {
    if (!selectedTransaction) return;
    
    await updateTransaction(selectedTransaction.id, {
      description: editedDescription,
      amount: parseFloat(editedAmount),
      type: editedType as 'income' | 'expense',
      category_id: editedCategoryId
    });
    
    setEditModalVisible(false);
  };

  const handleDeleteTransaction = async (): Promise<void> => {
    if (!selectedTransaction) return;
    
    await deleteTransaction(selectedTransaction.id);
    setDeleteModalVisible(false);
  };

  const openMenu = (transactionId: string): void => {
    setActiveTransactionId(transactionId);
    setMenuVisible(true);
  };

  const renderTransactionItem = (item: Transaction): JSX.Element => {
    const categoryName = getCategoryName(item.category_id);
    const Icon = getCategoryIcon(categoryName);

    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => openEditModal(item)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.iconContainer}>
            <Icon size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.transactionInfo}>
            <Text variant="titleMedium" style={styles.description}>
              {item.description}
            </Text>
            <Text variant="bodySmall" style={styles.metadata}>
              {categoryName}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <Text 
              variant="titleMedium" 
              style={[
                styles.amount,
                { color: item.type === 'income' ? theme.colors.primary : theme.colors.error }
              ]}
            >
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <Menu
              visible={menuVisible && activeTransactionId === item.id}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon={({ size, color }) => <MoreVertical size={size} color={color} />}
                  onPress={() => openMenu(item.id)}
                />
              }
            >
              <Menu.Item 
                leadingIcon={({ size, color }) => <Edit3 size={size} color={color} />}
                onPress={() => {
                  setMenuVisible(false);
                  openEditModal(item);
                }} 
                title="Edit" 
              />
              <Menu.Item 
                leadingIcon={({ size, color }) => <Trash2 size={size} color={theme.colors.error} />}
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedTransaction(item);
                  setDeleteModalVisible(true);
                }} 
                title="Delete" 
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }: { item: GroupedTransactions }): JSX.Element => {
    return (
      <View style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Text variant="titleMedium" style={[styles.dateText, { color: theme.colors.onBackground }]}>
            {item.formattedDate}, {item.dayOfWeek}
          </Text>
        </View>
        
        <View style={styles.transactionsContainer}>
          {item.transactions.map(transaction => (
            <View key={transaction.id}>
              {renderTransactionItem(transaction)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      {groupedTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noDataText}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={groupedTransactions}
          renderItem={renderDateGroup}
          keyExtractor={item => item.date}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Edit Transaction Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Edit Transaction</Text>
          
          <TextInput
            label="Description"
            value={editedDescription}
            onChangeText={setEditedDescription}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Amount"
            value={editedAmount}
            onChangeText={setEditedAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          
          <SegmentedButtons
            value={editedType}
            onValueChange={setEditedType}
            buttons={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <View style={styles.categorySelector}>
            <Text variant="bodyLarge" style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryOptions}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    editedCategoryId === category.id && { 
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary
                    }
                  ]}
                  onPress={() => setEditedCategoryId(category.id)}
                >
                  <Text 
                    style={[
                      styles.categoryText,
                      editedCategoryId === category.id && { color: theme.colors.primary }
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUpdateTransaction}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Delete Transaction</Text>
          <Text variant="bodyLarge" style={styles.deleteConfirmText}>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </Text>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDeleteTransaction}
              style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 20,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateText: {
    fontWeight: '600',
  },
  transactionsContainer: {
    backgroundColor: 'white',
  },
  transactionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontWeight: '500',
  },
  metadata: {
    opacity: 0.6,
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  amount: {
    fontWeight: '600',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categorySelector: {
    marginBottom: 20,
  },
  categoryLabel: {
    marginBottom: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
  deleteConfirmText: {
    marginBottom: 20,
    opacity: 0.7,
  },
});