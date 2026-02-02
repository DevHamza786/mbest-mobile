/**
 * MessagesScreen - MBEST Mobile App
 * Messages and chat interface
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';

export const MessagesScreen: React.FC = () => {
  // TODO: Implement messages functionality
  const messages: any[] = [];

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>{item.message}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  messageCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

