// Frontend (React) - src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // This will be proxied in development
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchMap = async () => {
  const response = await api.get('record/map');
  return response.data;
};

export const fetchEnvironment = async () => {
  const response = await api.get('record/environment');
  return response.data;
};