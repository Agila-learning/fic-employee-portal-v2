import apiClient from './apiClient';

export const employeeService = {
    getEmployees: async (params?: any) => {
        const response = await apiClient.get('/users', { params });
        return response.data;
    },

    updateEmployee: async (id: string, employeeData: any) => {
        const response = await apiClient.put(`/users/${id}`, employeeData);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    },

    createEmployee: async (employeeData: any) => {
        const response = await apiClient.post('/users/register', employeeData); // Reuse register for employee creation
        return response.data;
    },

    getTodayBirthdays: async () => {
        const response = await apiClient.get('/users/birthdays/today');
        return response.data;
    }
};
