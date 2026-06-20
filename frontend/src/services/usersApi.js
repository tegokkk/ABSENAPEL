import apiClient from './apiClient';

export const usersApi = {
  getUsers: async (params) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
  createUser: async (data) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  resetPassword: async (id) => {
    const response = await apiClient.put(`/users/${id}/reset-password`);
    return response.data;
  },
};
