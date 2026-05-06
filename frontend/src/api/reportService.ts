import apiClient from './apiClient';

export const reportService = {
    getReports: async (params?: any) => {
        const response = await apiClient.get('/reports', { params });
        return response.data;
    },

    createReport: async (reportData: any) => {
        const response = await apiClient.post('/reports', reportData);
        return response.data;
    },

    deleteReport: async (id: string) => {
        const response = await apiClient.delete(`/reports/${id}`);
        return response.data;
    },

    exportReports: async (params: { startDate?: string; endDate?: string; department?: string; branch?: string }) => {
        const response = await apiClient.get('/reports/export', { 
            params,
            responseType: 'blob' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `EmployeeReports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
