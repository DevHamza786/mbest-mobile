/**
 * TutorMoreScreen - MBEST Mobile App
 * More menu with all tutor features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { TutorStackParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<TutorStackParamList>;

interface MoreMenuItem {
  id: string;
  title: string;
  icon: string;
  screen: keyof TutorStackParamList | 'Messages';
  iconColor?: string;
}

interface MenuSection {
  title: string;
  items: MoreMenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'MANAGEMENT',
    items: [
      {
        id: 'attendance',
        title: 'Attendance',
        icon: 'check-circle',
        screen: 'TutorAttendance',
      },
      {
        id: 'attendance-records',
        title: 'Attendance Records',
        icon: 'clipboard',
        screen: 'TutorAttendance',
      },
      {
        id: 'hours',
        title: 'Hours & Payments',
        icon: 'clock',
        screen: 'TutorHours',
      },
      {
        id: 'availability',
        title: 'Availability',
        icon: 'clock',
        screen: 'TutorAvailability',
      },
      {
        id: 'leave-request',
        title: 'Leave Request',
        icon: 'calendar',
        screen: 'TutorLessonRequests',
      },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      {
        id: 'resources',
        title: 'Resources',
        icon: 'book',
        screen: 'TutorResources',
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        id: 'messages',
        title: 'Messages',
        icon: 'message-square',
        screen: 'Messages',
      },
    ],
  },
];

export const TutorMoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  const handleNavigation = (screen: string) => {
    if (screen === 'Messages') {
      // Navigate to Messages tab
      navigation.navigate('TutorTabs', { screen: 'Messages' } as any);
    } else {
      navigation.navigate(screen as keyof TutorStackParamList);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="More" showProfile />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {MENU_SECTIONS.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNavigation(item.screen)}
                activeOpacity={0.7}
              >
                <Card style={styles.menuItem}>
                  <Icon name={item.icon as any} size={20} color={colors.text} />
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    includeFontPadding: false,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  menuItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    includeFontPadding: false,
  },
});
