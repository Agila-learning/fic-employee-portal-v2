import apiClient from './apiClient';

export const policyService = {
    getPolicies: async () => {
        const response = await apiClient.get('/policies');
        return response.data;
    },

    createPolicy: async (policyData: any) => {
        const response = await apiClient.post('/policies', policyData);
        return response.data;
    },

    updatePolicy: async (id: string, policyData: any) => {
        const response = await apiClient.put(`/policies/${id}`, policyData);
        return response.data;
    },

    deletePolicy: async (id: string) => {
        const response = await apiClient.delete(`/policies/${id}`);
        return response.data;
    }
};
