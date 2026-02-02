/**
 * Navbar Component - Reusable bottom navigation bar
 * Fully responsive for Android and iOS with proper safe area handling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  onPress: () => void;
}

interface NavbarProps {
  items: NavItem[];
  activeRoute: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Navbar: React.FC<NavbarProps> = ({ items, activeRoute }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate responsive values
  const itemCount = items.length;
  const baseHeight = Platform.OS === 'ios' ? 60 : 64;
  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? spacing.sm : spacing.xs);
  const totalHeight = baseHeight + safeBottomPadding;
  
  // Responsive font sizes based on screen width
  const isSmallScreen = SCREEN_WIDTH < 360;
  const iconSize = isSmallScreen ? 20 : 24;
  const labelFontSize = isSmallScreen ? 10 : 11;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: safeBottomPadding,
          minHeight: totalHeight,
          paddingTop: spacing.sm,
        },
      ]}
    >
      {items.map((item, index) => {
        const isActive = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            onPress={item.onPress}
            style={[
              styles.navItem,
              { 
                minWidth: SCREEN_WIDTH / itemCount,
                maxWidth: SCREEN_WIDTH / itemCount,
              }
            ]}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
          >
            <View style={styles.iconContainer}>
              <Text
                style={[
                  styles.navIcon,
                  { fontSize: iconSize },
                  isActive && styles.navIconActive,
                ]}
              >
                {item.icon}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </View>
            <Text
              style={[
                styles.navLabel,
                { fontSize: labelFontSize },
                isActive && styles.navLabelActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
    elevation: Platform.OS === 'android' ? 12 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? -2 : -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: Platform.OS === 'ios' ? 8 : 12,
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 56,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
    minHeight: 28,
    minWidth: 28,
  },
  navIcon: {
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 24 : 28,
  },
  navIconActive: {
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    fontWeight: '600',
    color: colors.textTertiary,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'ios' ? 14 : 16,
    textAlign: 'center',
    maxWidth: '100%',
    paddingHorizontal: spacing.xs,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -spacing.xs,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
});

