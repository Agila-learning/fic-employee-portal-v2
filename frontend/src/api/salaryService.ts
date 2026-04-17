import apiClient from './apiClient';

export const salaryService = {
    getAllSalaryDetails: async () => {
        const response = await apiClient.get('/salary/all');
        return response.data;
    },

    getSalaryDetail: async (userId: string) => {
        const response = await apiClient.get(`/salary/${userId}`);
        return response.data;
    },

    upsertSalaryDetail: async (data: any) => {
        const response = await apiClient.post('/salary', data);
        return response.data;
    },

    addMonthlySalary: async (data: any) => {
        const response = await apiClient.put('/salary/monthly', data);
        return response.data;
    },

    deleteSalaryDetail: async (id: string) => {
        const response = await apiClient.delete(`/salary/${id}`);
        return response.data;
    },

    deleteMonthlySalary: async (userId: string, month: string, year: string) => {
        const response = await apiClient.delete(`/salary/monthly/${userId}/${month}/${year}`);
        return response.data;
    }
};
