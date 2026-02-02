import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = 'medium',
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (disabled || loading) {
      return [...baseStyle, styles.buttonDisabled, style];
    }
    
    if (variant === 'outline' || variant === 'ghost') {
      return [...baseStyle, styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`], style];
    }
    
    return [...baseStyle, styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`], style];
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.buttonText, styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}`]];
    
    if (disabled || loading) {
      return [...baseTextStyle, styles.buttonTextDisabled, textStyle];
    }
    
    if (variant === 'outline' || variant === 'ghost') {
      return [...baseTextStyle, styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}`], textStyle];
    }
    
    return [...baseTextStyle, styles.buttonTextPrimary, textStyle];
  };

  const renderButtonContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} 
          size="small"
        />
      );
    }
    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  buttonMedium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  buttonLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    ...shadows.lg,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
    ...shadows.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...textStyles.button,
  },
  buttonTextSmall: {
    fontSize: 14,
  },
  buttonTextMedium: {
    fontSize: 16,
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  buttonTextPrimary: {
    color: colors.textInverse,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonTextGhost: {
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
});

