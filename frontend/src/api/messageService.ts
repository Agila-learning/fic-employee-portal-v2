import apiClient from './apiClient';

export const messageService = {
  getChatList: async () => {
    const response = await apiClient.get('/messages/list');
    return response.data;
  },

  getMessages: async (otherUserId: string) => {
    const response = await apiClient.get(`/messages/history/${otherUserId}`);
    return response.data;
  },

  sendMessage: async (receiverId: string, content: string, extra: any = {}) => {
    const response = await apiClient.post('/messages/send', { receiverId, content, ...extra });
    return response.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'chat-attachments');
    const response = await apiClient.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteMessage: async (id: string) => {
    const response = await apiClient.delete(`/messages/${id}`);
    return response.data;
  }
};
