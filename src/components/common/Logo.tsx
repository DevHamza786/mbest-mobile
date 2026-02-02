/**
 * Logo Component - MBEST Mobile App
 * Displays the "MATHEMATICS BEYOND TUTORING" logo image
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import logoImage from '../../assets/images/logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  darkBackground?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium',
  showTagline = false,
  darkBackground = false,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 200,
          height: 80,
          taglineFontSize: 11,
        };
      case 'large':
        return {
          width: 320,
          height: 128,
          taglineFontSize: 18,
        };
      default: // medium
        return {
          width: 260,
          height: 104,
          taglineFontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <Image 
        source={logoImage} 
        style={[
          styles.logoImage,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
          }
        ]}
        resizeMode="contain"
      />
      
      {showTagline && (
        <Text 
          style={[
            styles.tagline, 
            { 
              fontSize: sizeStyles.taglineFontSize,
              color: darkBackground ? colors.textInverse : colors.textSecondary,
            }
          ]}
        >
          Mobile Learning Platform
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoImage: {
    // Image dimensions will be set dynamically based on size prop
  },
  tagline: {
    marginTop: spacing.sm,
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
