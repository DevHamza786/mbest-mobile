/**
 * TutorCalendarScreen - MBEST Mobile App
 * Calendar view for tutor sessions
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export const TutorCalendarScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <Text style={styles.subtitle}>Session calendar will be displayed here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

