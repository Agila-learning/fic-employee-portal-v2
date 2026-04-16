import api from './axios';

export const resignationService = {
  submitResignation: async (data: any) => {
    const response = await api.post('/api/resignations', data);
    return response.data;
  },

  getMyResignation: async () => {
    const response = await api.get('/api/resignations/my-resignation');
    return response.data;
  },

  getAllResignations: async () => {
    const response = await api.get('/api/resignations/all');
    return response.data;
  },

  updateResignationStatus: async (id: string, status: string, remarks?: string) => {
    const response = await api.put(`/api/resignations/${id}/status`, { status, remarks });
    return response.data;
  },

  updateAssets: async (id: string, assets: any[]) => {
    const response = await api.put(`/api/resignations/${id}/assets`, { assets });
    return response.data;
  },

  finalizeResignation: async (id: string) => {
    const response = await api.put(`/api/resignations/${id}/finalize`);
    return response.data;
  }
};
