import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface MessageParticipant {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: number;
  thread_id: string;
  sender_id: number;
  recipient_id: number;
  subject: string;
  body: string;
  is_read: boolean;
  is_important?: boolean;
  created_at: string;
  sender?: MessageParticipant;
  recipient?: MessageParticipant;
}

export interface MessageThread {
  thread_id: string;
  last_message: {
    id: number;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
    sender: MessageParticipant;
  };
  unread_count: number;
  participant: MessageParticipant;
}

export const messagesService = {
  getThreads: async (): Promise<ApiResponse<MessageThread[]>> => {
    const response = await apiClient.get<ApiResponse<MessageThread[]>>('/messages/threads');
    return response.data;
  },

  getThreadMessages: async (threadId: string): Promise<ApiResponse<{ data: Message[] } | Message[]>> => {
    const response = await apiClient.get<ApiResponse<{ data: Message[] } | Message[]>>('/messages', {
      params: { thread_id: threadId, per_page: 100 },
    });
    return response.data;
  },

  sendMessage: async (data: {
    recipient_id: number;
    subject: string;
    body: string;
    thread_id?: string;
  }): Promise<ApiResponse<Message>> => {
    const response = await apiClient.post<ApiResponse<Message>>('/messages', data);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/messages/${id}/read`);
  },
};
