import apiClient from './apiClient';

export const jadwalApi = {
  getJadwal: async () => {
    const response = await apiClient.get('/jadwal');
    return response.data;
  },
  createJadwal: async (data) => {
    const response = await apiClient.post('/jadwal', data);
    return response.data;
  },
  updateJadwal: async (id, data) => {
    const response = await apiClient.put(`/jadwal/${id}`, data);
    return response.data;
  },
  deleteJadwal: async (id) => {
    const response = await apiClient.delete(`/jadwal/${id}`);
    return response.data;
  },
};
