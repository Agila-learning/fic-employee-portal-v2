import apiClient from './apiClient';

export const attendanceService = {
  getAttendanceForDateRange: async (filters: any) => {
    const response = await apiClient.get('/operations/attendance', { params: filters });
    return response.data;
  }
};
