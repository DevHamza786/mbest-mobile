import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  padding = 'md',
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const variantKey = `card${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles;
    const paddingKey = `padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles;
    const baseStyle = [styles.card, styles[variantKey]];
    const paddingStyle = styles[paddingKey];
    const styleArray = Array.isArray(style) ? style : style ? [style] : [];
    return [...baseStyle, paddingStyle, ...styleArray].filter(Boolean) as ViewStyle[];
  };

  return <View style={getCardStyle()}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
  },
  cardDefault: {
    ...shadows.md,
  },
  cardElevated: {
    ...shadows.lg,
    backgroundColor: colors.surfaceElevated,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: spacing.sm,
  },
  paddingMd: {
    padding: spacing.md,
  },
  paddingLg: {
    padding: spacing.lg,
  },
});

