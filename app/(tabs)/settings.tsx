import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, TextInput, List, IconButton, Dialog, Portal, useTheme, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import IconSelector from '@/components/IconSelector';
import { renderIcon } from '@/utils/iconUtils';
import { toggleNotifications, areNotificationsEnabled } from '@/components/NotificationCenter';

export default function SettingsScreen() {
  const { user, signOut, session } = useAuth();
  const theme = useTheme();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    is_premium: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isIconSelectorVisible, setIsIconSelectorVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCategories();
      checkNotificationSettings();
    }
  }, [user]);

  const checkNotificationSettings = async () => {
    const enabled = await areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  };

  const handleToggleNotifications = async (value: boolean) => {
    const success = await toggleNotifications(value);
    if (success) {
      setNotificationsEnabled(value);
    } else {
      // If toggling failed, revert to the previous state
      setNotificationsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: user?.email || '',
          is_premium: data.is_premium || false,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('type')
        .order('name');

      if (error) throw error;

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateProfile = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      // Create category data with required fields
      const categoryData: any = { 
        name: newCategory.trim(), 
        user_id: user?.id,
        type: newCategoryType
      };
      
      // Add icon field if supported by the database
      try {
        categoryData.icon = 'tag';
      } catch (e) {
        console.log('Icon field not supported yet');
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select();

      if (error) throw error;

      if (data) {
        setCategories([...categories, data[0]]);
        setNewCategory('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      // Create update data with required fields
      const updateData: any = { 
        name: editingCategory.name,
        type: editingCategory.type
      };
      
      // Add icon field if supported by the database
      if (editingCategory.icon) {
        try {
          updateData.icon = editingCategory.icon;
        } catch (e) {
          console.log('Icon field not supported yet');
        }
      }

      const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', editingCategory.id);

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? editingCategory : cat
      ));
      setEditingCategory(null);
      setIsDialogVisible(false);
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This will not delete associated transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

              if (error) throw error;

              setCategories(categories.filter(cat => cat.id !== id));
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        },
      ]
    );
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsDialogVisible(true);
  };

  const handleCategoryTypeChange = (type: 'income' | 'expense') => {
    if (editingCategory) {
      setEditingCategory({
        ...editingCategory,
        type
      });
    }
  };

  const handleUpgradeToPremium = async () => {
    // In a real app, this would integrate with a payment processor
    // For this demo, we'll just toggle the premium status
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: !profile.is_premium })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({
        ...profile,
        is_premium: !profile.is_premium
      });

      Alert.alert(
        'Success', 
        profile.is_premium 
          ? 'Premium subscription canceled' 
          : 'Upgraded to premium successfully'
      );
    } catch (error) {
      console.error('Error updating premium status:', error);
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  const handleIconSelect = (iconName: string) => {
    if (editingCategory) {
      setEditingCategory({
        ...editingCategory,
        icon: iconName
      });
    }
    setIsIconSelectorVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Settings</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Profile</Text>
            <TextInput
              label="Full Name"
              value={profile.full_name}
              onChangeText={(text) => setProfile({ ...profile, full_name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={profile.email}
              disabled
              mode="outlined"
              style={styles.input}
            />
            <Button 
              mode="contained" 
              onPress={updateProfile} 
              loading={isLoading}
              style={styles.button}
            >
              Update Profile
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Categories</Text>
            <View style={styles.categoryInputContainer}>
              <TextInput
                label="New Category"
                value={newCategory}
                onChangeText={setNewCategory}
                mode="outlined"
                style={styles.categoryInput}
              />
              <Button 
                mode="contained" 
                onPress={handleAddCategory}
                style={styles.addButton}
              >
                Add
              </Button>
            </View>
            
            <View style={styles.categoryTypeContainer}>
              <Text variant="bodyMedium" style={styles.categoryTypeLabel}>Category Type:</Text>
              <View style={styles.categoryTypeButtons}>
                <Button 
                  mode={newCategoryType === 'expense' ? 'contained' : 'outlined'}
                  onPress={() => setNewCategoryType('expense')}
                  style={styles.categoryTypeButton}
                >
                  Expense
                </Button>
                <Button 
                  mode={newCategoryType === 'income' ? 'contained' : 'outlined'}
                  onPress={() => setNewCategoryType('income')}
                  style={styles.categoryTypeButton}
                >
                  Income
                </Button>
              </View>
            </View>
            
            <List.Section>
              {categories.map(category => (
                <List.Item
                  key={category.id}
                  title={category.name}
                  description={`Type: ${category.type.charAt(0).toUpperCase() + category.type.slice(1)}`}
                  left={props => (
                    <View style={styles.categoryIcon}>
                      {category.icon && renderIcon(category.icon, { size: 24, color: theme.colors.onSurface })}
                    </View>
                  )}
                  right={props => (
                    <View style={styles.categoryActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditCategory(category)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteCategory(category.id)}
                      />
                    </View>
                  )}
                  style={styles.categoryItem}
                />
              ))}
              {categories.length === 0 && (
                <Text style={styles.noDataText}>No categories added yet</Text>
              )}
            </List.Section>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title="Notifications" />
          <Card.Content>
            <View style={styles.settingRow}>
              <Text>Daily Budget Reminder (8 PM)</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
              />
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Subscription</Text>
            <Text style={styles.subscriptionText}>
              {profile.is_premium 
                ? 'You are currently on the Premium plan. Enjoy all features including the AI financial advisor!' 
                : 'Upgrade to Premium to access the AI financial advisor and get personalized financial tips.'}
            </Text>
            <Button 
              mode="contained" 
              onPress={handleUpgradeToPremium}
              style={[styles.button, profile.is_premium ? styles.cancelButton : {}]}
            >
              {profile.is_premium ? 'Cancel Premium' : 'Upgrade to Premium'}
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Account</Text>
            <Button 
              mode="outlined" 
              onPress={signOut}
              style={styles.button}
              textColor={theme.colors.error}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
          <Dialog.Title>Edit Category</Dialog.Title>
          <Dialog.Content>
            <View style={styles.iconPreview}>
              {editingCategory?.icon && renderIcon(editingCategory.icon, { size: 40, color: theme.colors.primary })}
            </View>
            <TextInput
              label="Category Name"
              value={editingCategory?.name || ''}
              onChangeText={(text) => setEditingCategory(prev => prev ? {...prev, name: text} : null)}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.categoryTypeContainer}>
              <Text variant="bodyMedium" style={styles.categoryTypeLabel}>Category Type:</Text>
              <View style={styles.categoryTypeButtons}>
                <Button 
                  mode={editingCategory?.type === 'expense' ? 'contained' : 'outlined'}
                  onPress={() => handleCategoryTypeChange('expense')}
                  style={styles.categoryTypeButton}
                >
                  Expense
                </Button>
                <Button 
                  mode={editingCategory?.type === 'income' ? 'contained' : 'outlined'}
                  onPress={() => handleCategoryTypeChange('income')}
                  style={styles.categoryTypeButton}
                >
                  Income
                </Button>
              </View>
            </View>
            <Button 
              mode="contained" 
              onPress={() => setIsIconSelectorVisible(true)}
              style={styles.button}
            >
              Change Icon
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdateCategory}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        <IconSelector 
          visible={isIconSelectorVisible} 
          onDismiss={() => setIsIconSelectorVisible(false)} 
          onSelect={handleIconSelect} 
          currentIcon={editingCategory?.icon}
        />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  categoryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    marginTop: 8,
  },
  categoryItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  categoryIcon: {
    marginRight: 12,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#888',
  },
  subscriptionText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  iconPreview: {
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryTypeContainer: {
    marginBottom: 16,
  },
  categoryTypeLabel: {
    marginBottom: 8,
  },
  categoryTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTypeButton: {
    flex: 1,
    marginRight: 8,
  },
  notificationsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationsToggleLabel: {
    marginRight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});