import apiClient from './apiClient';

export const expenseService = {
    getExpenses: async () => {
        const response = await apiClient.get('/expenses');
        return response.data;
    },

    createExpense: async (expenseData: any) => {
        const response = await apiClient.post('/expenses', expenseData);
        return response.data;
    },

    getCredits: async () => {
        const response = await apiClient.get('/expenses/credits');
        return response.data;
    },

    addCredit: async (creditData: any) => {
        const response = await apiClient.post('/expenses/credits', creditData);
        return response.data;
    },

    uploadReceipt: async (formData: FormData) => {
        const response = await apiClient.post('/expenses/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
