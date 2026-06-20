import apiClient from './apiClient';

export const izinApi = {
  getIzins: async () => {
    const response = await apiClient.get('/izin');
    return response.data;
  },
  createIzin: async (data) => {
    const response = await apiClient.post('/izin', data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await apiClient.put(`/izin/${id}/status`, { status });
    return response.data;
  },
};
