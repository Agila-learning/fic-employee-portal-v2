import apiClient from './apiClient';

export const operationService = {
    // Payslips
    getMyPayslips: async () => {
        const response = await apiClient.get('/operations/payslips/my');
        return response.data;
    },

    getAllPayslips: async () => {
        const response = await apiClient.get('/operations/payslips');
        return response.data;
    },

    getLatestPayslip: async (userId: string) => {
        const response = await apiClient.get(`/operations/payslips/latest/${userId}`);
        return response.data;
    },

    createPayslip: async (payslipData: any) => {
        const response = await apiClient.post('/operations/payslips', payslipData);
        return response.data;
    },

    deletePayslip: async (id: string) => {
        const response = await apiClient.delete(`/operations/payslips/${id}`);
        return response.data;
    },

    // Leave Requests
    getMyLeaveRequests: async () => {
        const response = await apiClient.get('/operations/leave/my');
        return response.data;
    },

    getAllLeaveRequests: async () => {
        const response = await apiClient.get('/operations/leave');
        return response.data;
    },

    createLeaveRequest: async (leaveData: any) => {
        const response = await apiClient.post('/operations/leave', leaveData);
        return response.data;
    },

    updateLeaveStatus: async (id: string, status: string) => {
        const response = await apiClient.put(`/operations/leave/${id}`, { status });
        return response.data;
    },

    // Holidays
    getHolidays: async () => {
        const response = await apiClient.get('/operations/holidays');
        return response.data;
    },

    createHoliday: async (holidayData: any) => {
        const response = await apiClient.post('/operations/holidays', holidayData);
        return response.data;
    },

    deleteHoliday: async (id: string) => {
        const response = await apiClient.delete(`/operations/holidays/${id}`);
        return response.data;
    }
};
