/**
 * SettingsScreen - MBEST Mobile App
 * App settings screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';

export const SettingsScreen: React.FC = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Theme Settings */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {/* About Section */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Terms & Conditions</Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutLabel: {
    fontSize: 16,
    color: colors.text,
  },
  aboutValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
  },
  linkArrow: {
    fontSize: 20,
    color: colors.primary,
  },
});

