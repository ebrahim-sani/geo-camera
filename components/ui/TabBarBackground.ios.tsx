import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { View } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <View className="absolute inset-0 bg-black/80">
      <BlurView
        // Use dark tint to ensure consistent dark appearance
        tint="dark"
        intensity={100}
        className="absolute inset-0"
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}