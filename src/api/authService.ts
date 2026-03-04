import apiClient from './apiClient';

export const authService = {
    login: async (email: string, password: string) => {
        const response = await apiClient.post('/users/login', { email, password });
        return response.data;
    },

    register: async (userData: any) => {
        const response = await apiClient.post('/users/register', userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await apiClient.get('/users/profile');
        return response.data;
    },

    updatePassword: async (password: string) => {
        const response = await apiClient.put('/users/update-password', { password });
        return response.data;
    }
};
