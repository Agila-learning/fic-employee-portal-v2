import apiClient from './apiClient';

export const reportService = {
    getReports: async () => {
        const response = await apiClient.get('/reports');
        return response.data;
    },

    createReport: async (reportData: any) => {
        const response = await apiClient.post('/reports', reportData);
        return response.data;
    },

    deleteReport: async (id: string) => {
        const response = await apiClient.delete(`/reports/${id}`);
        return response.data;
    }
};
