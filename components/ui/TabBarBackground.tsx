import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

export default function TabBarBackground() {
  return (
    <View className="absolute inset-0 bg-black/80" />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}