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

  sendMessage: async (receiverId: string, content: string, extra: any = {}) => {
    const response = await apiClient.post('/messages/send', { receiverId, content, ...extra });
    return handleResponse(response);
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'chat-attachments');
    const response = await apiClient.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return handleResponse(response);
  }
};
