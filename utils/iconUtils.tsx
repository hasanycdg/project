import React from 'react';
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
  Landmark,
  Tag
} from 'lucide-react-native';

// Map of icon names to components
const iconMap: { [key: string]: React.ComponentType<any> } = {
  'home': Home,
  'shopping-cart': ShoppingCart,
  'coffee': Coffee,
  'car': Car,
  'utensils': Utensils,
  'briefcase': Briefcase,
  'plane': Plane,
  'gift': Gift,
  'heart': Heart,
  'film': Film,
  'book': Book,
  'dumbbell': Dumbbell,
  'wifi': Wifi,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'smartphone': Smartphone,
  'bus': Bus,
  'droplet': Droplet,
  'zap': Zap,
  'monitor': Monitor,
  'shirt': Shirt,
  'scissors': Scissors,
  'pill': Pill,
  'baby': Baby,
  'gamepad-2': Gamepad2,
  'music': Music,
  'piggy-bank': PiggyBank,
  'wallet': Wallet,
  'building': Building,
  'graduation-cap': GraduationCap,
  'wrench': Wrench,
  'landmark': Landmark
};

/**
 * Get an icon component by name
 * @param iconName The name of the icon to get
 * @returns The icon component or a default Tag icon if not found
 */
export const getIconByName = (iconName?: string) => {
  if (!iconName) return Tag;
  return iconMap[iconName] || Tag;
};

/**
 * Render an icon by name with the given props
 * @param iconName The name of the icon to render
 * @param props Props to pass to the icon component
 * @returns A React element with the requested icon
 */
export const renderIcon = (iconName?: string, props?: any) => {
  const IconComponent = getIconByName(iconName);
  return <IconComponent {...props} />;
};
