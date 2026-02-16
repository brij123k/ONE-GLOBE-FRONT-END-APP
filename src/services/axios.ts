import axios from 'axios';

const instance = axios.create({
  // baseURL: 'http://localhost:3000',
  baseURL: 'https://starfish-app-djdfs.ondigitalocean.app',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



export default instance;
