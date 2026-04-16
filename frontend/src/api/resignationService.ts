import api from './apiClient';

export const resignationService = {
  submitResignation: async (data: any) => {
    const response = await api.post('/resignations', data);
    return response.data;
  },

  getMyResignation: async () => {
    const response = await api.get('/resignations/my-resignation');
    return response.data;
  },

  getAllResignations: async () => {
    const response = await api.get('/resignations/all');
    return response.data;
  },

  updateResignationStatus: async (id: string, status: string, remarks?: string) => {
    const response = await api.put(`/resignations/${id}/status`, { status, remarks });
    return response.data;
  },

  updateAssets: async (id: string, assets: any[]) => {
    const response = await api.put(`/resignations/${id}/assets`, { assets });
    return response.data;
  },

  finalizeResignation: async (id: string) => {
    const response = await api.put(`/resignations/${id}/finalize`);
    return response.data;
  },

  revokeResignation: async (id: string) => {
    const response = await api.delete(`/resignations/${id}/revoke`);
    return response.data;
  }
};
