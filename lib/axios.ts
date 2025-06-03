//axios instance แบบแปะ token ให้อัตโนมัติ
import axios from 'axios';
import { getSession } from './session';

export const api = axios.create({
  baseURL: 'https://api-nurse-demo-production.up.railway.app',
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});
