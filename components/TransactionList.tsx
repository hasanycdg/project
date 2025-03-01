import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, List, IconButton, Modal, Portal, Button, TextInput, SegmentedButtons, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';
import { useData } from '@/context/DataContext';
import { ShoppingBag, DollarSign, Home, Car, Coffee, Gift, Heart, Plane, MoreVertical, Trash2, Edit3 } from 'lucide-react-native';
import type { Transaction, Category } from '@/types';

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'shopping':
      return ShoppingBag;
    case 'salary':
      return DollarSign;
    case 'rent':
      return Home;
    case 'transportation':
      return Car;
    case 'food & dining':
      return Coffee;
    case 'entertainment':
      return Gift;
    case 'health':
      return Heart;
    case 'travel':
      return Plane;
    default:
      return ShoppingBag;
  }
};

export default function TransactionList({ transactions, categories }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { refreshData, updateTransaction, deleteTransaction } = useData();
  const [refreshing, setRefreshing] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedCategoryId, setEditedCategoryId] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditedDescription(transaction.description);
    setEditedAmount(transaction.amount.toString());
    setEditedType(transaction.type);
    setEditedCategoryId(transaction.category_id);
    setEditModalVisible(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;
    
    await updateTransaction(selectedTransaction.id, {
      description: editedDescription,
      amount: parseFloat(editedAmount),
      type: editedType as 'income' | 'expense',
      category_id: editedCategoryId
    });
    
    setEditModalVisible(false);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    await deleteTransaction(selectedTransaction.id);
    setDeleteModalVisible(false);
  };

  const openMenu = (transactionId: string) => {
    setActiveTransactionId(transactionId);
    setMenuVisible(true);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const categoryName = getCategoryName(item.category_id);
    const Icon = getCategoryIcon(categoryName);

    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.iconContainer}>
          <Icon size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.transactionInfo}>
          <Text variant="titleMedium" style={styles.description}>
            {item.description}
          </Text>
          <Text variant="bodySmall" style={styles.metadata}>
            {format(new Date(item.date), 'MMM dd')} • {categoryName}
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
                icon={() => <MoreVertical size={20} color={theme.colors.onSurfaceVariant} />}
                onPress={() => openMenu(item.id)}
              />
            }
          >
            <Menu.Item 
              leadingIcon={() => <Edit3 size={20} color={theme.colors.onSurface} />}
              onPress={() => {
                setMenuVisible(false);
                openEditModal(item);
              }} 
              title="Edit" 
            />
            <Menu.Item 
              leadingIcon={() => <Trash2 size={20} color={theme.colors.error} />}
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
      </TouchableOpacity>
    );
  };

  return (
    <>
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No transactions found</Text>
        }
      />

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
          
          <Text variant="bodyMedium" style={styles.inputLabel}>Transaction Type</Text>
          <SegmentedButtons
            value={editedType}
            onValueChange={setEditedType}
            buttons={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' }
            ]}
            style={styles.segmentedButtons}
          />
          
          <Text variant="bodyMedium" style={styles.inputLabel}>Category</Text>
          <View style={styles.categoryPicker}>
            {categories.map(category => (
              <Button
                key={category.id}
                mode={editedCategoryId === category.id ? "contained" : "outlined"}
                onPress={() => setEditedCategoryId(category.id)}
                style={styles.categoryButton}
              >
                {category.name}
              </Button>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setEditModalVisible(false)}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUpdateTransaction}
              style={styles.actionButton}
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
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDeleteTransaction}
              buttonColor={theme.colors.error}
              style={styles.actionButton}
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
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontWeight: '500',
  },
  metadata: {
    marginTop: 2,
    opacity: 0.6,
  },
  amount: {
    fontWeight: '600',
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    margin: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  actionButton: {
    marginLeft: 8,
  },
  deleteConfirmText: {
    marginBottom: 20,
  }
});