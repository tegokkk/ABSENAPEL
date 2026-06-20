import apiClient from './apiClient';

export const attendanceApi = {
  getAttendance: async (params) => {
    const response = await apiClient.get('/attendance', { params });
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/attendance/stats');
    return response.data;
  },
  deleteAttendance: async (id) => {
    const response = await apiClient.delete(`/attendance/${id}`);
    return response.data;
  },
  submitApel: async (data) => {
    const response = await apiClient.post('/attendance/apel', data);
    return response.data;
  },
};
