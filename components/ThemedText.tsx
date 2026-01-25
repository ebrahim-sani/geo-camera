import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className = '',
  ...rest
}: ThemedTextProps & { className?: string }) {
  const color = useThemeColor({ dark: darkColor }, 'text');

  // Map type to Tailwind classes
  const typeClasses = {
    default: 'text-base leading-6',
    defaultSemiBold: 'text-base font-semibold leading-6',
    title: 'text-3xl font-bold leading-8',
    subtitle: 'text-xl font-bold',
    link: 'text-base text-blue-500',
  }[type];

  return (
    <Text
      className={`${typeClasses} ${className}`}
      style={[{ color }, style]}
      {...rest}
    />
  );
}