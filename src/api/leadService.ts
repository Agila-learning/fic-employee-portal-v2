import apiClient from './apiClient';

export const leadService = {
    getLeads: async () => {
        const response = await apiClient.get('/leads');
        return response.data;
    },

    createLead: async (leadData: any) => {
        const response = await apiClient.post('/leads', leadData);
        return response.data;
    },

    updateLead: async (id: string, leadData: any) => {
        const response = await apiClient.put(`/leads/${id}`, leadData);
        return response.data;
    },

    deleteLead: async (id: string) => {
        const response = await apiClient.delete(`/leads/${id}`);
        return response.data;
    }
};
