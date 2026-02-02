// Typography System for MBEST Mobile App
// Using system fonts with platform-specific optimizations
import { Platform } from 'react-native';

export const typography = {
  // Font Families - Modern, attractive system fonts
  fontFamily: {
    // iOS uses San Francisco, Android uses Roboto - both are modern and attractive
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Text Style Presets
export const textStyles = {
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['4xl'] * 1.2,
    letterSpacing: typography.letterSpacing.tight,
    includeFontPadding: false,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['3xl'] * 1.2,
    letterSpacing: typography.letterSpacing.tight,
    includeFontPadding: false,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize['2xl'] * 1.3,
    includeFontPadding: false,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * 1.4,
    includeFontPadding: false,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.base * 1.5,
    includeFontPadding: false,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * 1.5,
    includeFontPadding: false,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * 1.4,
    includeFontPadding: false,
  },
  small: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * 1.4,
    includeFontPadding: false,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },
};

