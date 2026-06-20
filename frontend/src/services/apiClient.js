import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized handling (token expired/invalid)
    if (error.response?.status === 401) {
      console.warn('[AUTH] Session expired or invalid token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if not already on login page to avoid loop
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    // Format error message for easier consumption by components
    const customError = new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Terjadi kesalahan pada server'
    );
    customError.response = error.response;
    customError.status = error.response?.status;

    console.error('[API ERROR]', {
      url: error.config?.url,
      status: customError.status,
      message: customError.message
    });

    return Promise.reject(customError);
  }
);

export default apiClient;
