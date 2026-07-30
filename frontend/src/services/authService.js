import { api } from '../api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  // Đăng nhập - Chuẩn OAuth2 với x-www-form-urlencoded
  login: async (username, password) => {
    // Tạo FormData theo đúng yêu cầu của FastAPI OAuth2
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('grant_type', '');
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');

    const response = await api.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, token_type, user_info } = response.data;

    if (access_token) {
      localStorage.setItem('access_token', access_token);
    }
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }

    if (user_info) {
      localStorage.setItem('user_info', JSON.stringify(user_info));
    }

    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user_info');
    return user ? JSON.parse(user) : null;
  },

  updateUserInfo: (userInfo) => {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getToken: () => {
    return localStorage.getItem('access_token');
  },
};