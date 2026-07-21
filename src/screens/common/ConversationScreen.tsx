/**
 * ConversationScreen - View and send messages within a single thread.
 * Poll-based refresh, matching MessagesScreen.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { messagesService, type Message } from '../../services/api/messages';
import { useAuthStore } from '../../store/authStore';
import type { ParentStackParamList } from '../../types/navigation';

type RouteProps = RouteProp<ParentStackParamList, 'Conversation'>;

const MESSAGE_POLL_INTERVAL_MS = 15000;

export const ConversationScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { threadId } = route.params;
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['messageThread', threadId],
    queryFn: () => messagesService.getThreadMessages(threadId),
    enabled: !!token,
    refetchInterval: MESSAGE_POLL_INTERVAL_MS,
  });

  const messages: Message[] = Array.isArray((data?.data as any)?.data)
    ? (data!.data as any).data
    : Array.isArray(data?.data)
      ? (data!.data as Message[])
      : [];

  const orderedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const otherParticipantId = orderedMessages.find((m) => m.sender_id !== user?.id)?.sender_id
    ?? orderedMessages[0]?.recipient_id;

  const sendMutation = useMutation({
    mutationFn: () =>
      messagesService.sendMessage({
        recipient_id: otherParticipantId!,
        subject: orderedMessages[0]?.subject || 'Conversation',
        body: draft.trim(),
        thread_id: threadId,
      }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messageThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Failed to send message';
      Alert.alert('Error', msg);
    },
  });

  const unreadReceivedIds = orderedMessages
    .filter((m) => !m.is_read && m.sender_id !== user?.id)
    .map((m) => m.id)
    .join(',');

  useEffect(() => {
    if (!unreadReceivedIds) return;

    const ids = unreadReceivedIds.split(',').map(Number);
    Promise.all(ids.map((id) => messagesService.markAsRead(id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    });
  }, [unreadReceivedIds, queryClient]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        <FlatList
          data={orderedMessages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user?.id;
            return (
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => draft.trim() && sendMutation.mutate()}
            disabled={sendMutation.isPending || !draft.trim() || !otherParticipantId}
          >
            <Icon name="arrow-right" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md },
  bubble: { maxWidth: '80%', borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  bubbleTextMine: { color: colors.textInverse },
  bubbleTextTheirs: { color: colors.text },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
