import apiClient from './apiClient';

export const lokasiApi = {
  getLokasi: async () => {
    const response = await apiClient.get('/lokasi');
    return response.data;
  },
  createLokasi: async (data) => {
    const response = await apiClient.post('/lokasi', data);
    return response.data;
  },
  updateLokasi: async (id, data) => {
    const response = await apiClient.put(`/lokasi/${id}`, data);
    return response.data;
  },
  deleteLokasi: async (id) => {
    const response = await apiClient.delete(`/lokasi/${id}`);
    return response.data;
  },
  activateLokasi: async (id) => {
    const response = await apiClient.put(`/lokasi/${id}/activate`);
    return response.data;
  },
};
