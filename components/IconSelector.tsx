import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Dialog, Portal, Button, useTheme } from 'react-native-paper';
import {
  Home,
  ShoppingCart,
  Coffee,
  Car,
  Utensils,
  Briefcase,
  Plane,
  Gift,
  Heart,
  Film,
  Book,
  Dumbbell,
  Wifi,
  CreditCard,
  DollarSign,
  Smartphone,
  Bus,
  Droplet,
  Zap,
  Monitor,
  Shirt,
  Scissors,
  Pill,
  Baby,
  Gamepad2,
  Music,
  PiggyBank,
  Wallet,
  Building,
  GraduationCap,
  Wrench,
  Landmark
} from 'lucide-react-native';

// Define the available icons
const availableIcons = [
  { name: 'home', component: Home },
  { name: 'shopping-cart', component: ShoppingCart },
  { name: 'coffee', component: Coffee },
  { name: 'car', component: Car },
  { name: 'utensils', component: Utensils },
  { name: 'briefcase', component: Briefcase },
  { name: 'plane', component: Plane },
  { name: 'gift', component: Gift },
  { name: 'heart', component: Heart },
  { name: 'film', component: Film },
  { name: 'book', component: Book },
  { name: 'dumbbell', component: Dumbbell },
  { name: 'wifi', component: Wifi },
  { name: 'credit-card', component: CreditCard },
  { name: 'dollar-sign', component: DollarSign },
  { name: 'smartphone', component: Smartphone },
  { name: 'bus', component: Bus },
  { name: 'droplet', component: Droplet },
  { name: 'zap', component: Zap },
  { name: 'monitor', component: Monitor },
  { name: 'shirt', component: Shirt },
  { name: 'scissors', component: Scissors },
  { name: 'pill', component: Pill },
  { name: 'baby', component: Baby },
  { name: 'gamepad-2', component: Gamepad2 },
  { name: 'music', component: Music },
  { name: 'piggy-bank', component: PiggyBank },
  { name: 'wallet', component: Wallet },
  { name: 'building', component: Building },
  { name: 'graduation-cap', component: GraduationCap },
  { name: 'wrench', component: Wrench },
  { name: 'landmark', component: Landmark }
];

interface IconSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  visible,
  onDismiss,
  onSelect,
  currentIcon = 'tag'
}) => {
  const theme = useTheme();
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(currentIcon);

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onSelect(selectedIcon);
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Select an Icon</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.scrollView}>
            <View style={styles.iconsContainer}>
              {availableIcons.map((icon) => {
                const IconComponent = icon.component;
                const isSelected = selectedIcon === icon.name;
                
                return (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconButton,
                      isSelected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                    onPress={() => handleIconSelect(icon.name)}
                  >
                    <IconComponent
                      size={24}
                      color={isSelected ? theme.colors.primary : theme.colors.onSurface}
                    />
                    <Text style={[
                      styles.iconText,
                      isSelected && { color: theme.colors.primary }
                    ]}>
                      {icon.name.replace(/-/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleConfirm} disabled={!selectedIcon}>
            Select
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  scrollView: {
    maxHeight: 400,
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  iconText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default IconSelector;
