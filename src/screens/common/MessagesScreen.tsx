/**
 * MessagesScreen - MBEST Mobile App
 * Thread list, poll-based refresh (no real-time dependency on mobile today).
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { messagesService, type MessageThread } from '../../services/api/messages';
import { useAuthStore } from '../../store/authStore';
import type { ParentTabParamList, ParentStackParamList } from '../../types/navigation';

type NavProp = CompositeNavigationProp<
  NavigationProp<ParentTabParamList>,
  StackNavigationProp<ParentStackParamList>
>;

const THREAD_POLL_INTERVAL_MS = 15000;

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['messageThreads'],
    queryFn: () => messagesService.getThreads(),
    enabled: !!token,
    refetchInterval: THREAD_POLL_INTERVAL_MS,
  });

  const threads: MessageThread[] = Array.isArray(data?.data) ? data.data : [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.thread_id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Conversation', {
                threadId: item.thread_id,
                participantName: item.participant?.name || 'Conversation',
              })
            }
          >
            <Card style={styles.threadCard}>
              <View style={styles.threadHeader}>
                <Text style={styles.participantName}>{item.participant?.name || 'Unknown'}</Text>
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subject} numberOfLines={1}>
                {item.last_message.subject}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message.body}
              </Text>
            </Card>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md },
  threadCard: { marginBottom: spacing.md, padding: spacing.md },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantName: { fontSize: 15, fontWeight: '700', color: colors.text },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '700' },
  subject: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
