import { apiClient, handleResponse } from './apiClient';

export const messageService = {
  getChatList: async () => {
    const response = await apiClient.get('/messages/list');
    return handleResponse(response);
  },

  getMessages: async (otherUserId: string) => {
    const response = await apiClient.get(`/messages/history/${otherUserId}`);
    return handleResponse(response);
  },

  sendMessage: async (receiverId: string, content: string) => {
    const response = await apiClient.post('/messages/send', { receiverId, content });
    return handleResponse(response);
  }
};
