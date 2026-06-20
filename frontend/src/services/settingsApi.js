import apiClient from './apiClient';

export const settingsApi = {
  getSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },
};
