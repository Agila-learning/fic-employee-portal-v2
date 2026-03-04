import apiClient from './apiClient';

export const operationService = {
    getMyPayslips: async () => {
        const response = await apiClient.get('/operations/payslips/my');
        return response.data;
    },

    getAllPayslips: async () => {
        const response = await apiClient.get('/operations/payslips');
        return response.data;
    },

    createPayslip: async (payslipData: any) => {
        const response = await apiClient.post('/operations/payslips', payslipData);
        return response.data;
    },

    getMyLeaveRequests: async () => {
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
    }
};
