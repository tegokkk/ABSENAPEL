import apiClient from './apiClient';

export const masterDataApi = {
  // Jurusan
  getJurusan: async () => (await apiClient.get('/jurusan')).data,
  createJurusan: async (data) => (await apiClient.post('/jurusan', data)).data,
  updateJurusan: async (id, data) => (await apiClient.put(`/jurusan/${id}`, data)).data,
  deleteJurusan: async (id) => (await apiClient.delete(`/jurusan/${id}`)).data,

  // Program Studi
  getProgramStudi: async () => (await apiClient.get('/program-studi')).data,
  createProgramStudi: async (data) => (await apiClient.post('/program-studi', data)).data,
  updateProgramStudi: async (id, data) => (await apiClient.put(`/program-studi/${id}`, data)).data,
  deleteProgramStudi: async (id) => (await apiClient.delete(`/program-studi/${id}`)).data,

  // Kelas
  getKelas: async () => (await apiClient.get('/kelas')).data,
  createKelas: async (data) => (await apiClient.post('/kelas', data)).data,
  updateKelas: async (id, data) => (await apiClient.put(`/kelas/${id}`, data)).data,
  deleteKelas: async (id) => (await apiClient.delete(`/kelas/${id}`)).data,
};
