import { AxiosInstance } from 'axios';
import axios from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Adjust if backend runs on a different port
});

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/uploadfile/', formData);
  return response.data;
};

export const convertFile = async (file: File, targetFormat: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_format', targetFormat);
  const response = await api.post('/convert/', formData, {
    responseType: 'blob', // Important for downloading files
  });
  return response;
};

export default api;