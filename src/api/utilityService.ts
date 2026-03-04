import apiClient from './apiClient';

export const utilityService = {
    getHolidays: async () => {
        const response = await apiClient.get('/utilities/holidays');
        return response.data;
    },

    createHoliday: async (holidayData: any) => {
        const response = await apiClient.post('/utilities/holidays', holidayData);
        return response.data;
    },

    getSuccessStories: async () => {
        const response = await apiClient.get('/utilities/success-stories');
        return response.data;
    },

    createSuccessStory: async (storyData: any) => {
        const response = await apiClient.post('/utilities/success-stories', storyData);
        return response.data;
    }
};
