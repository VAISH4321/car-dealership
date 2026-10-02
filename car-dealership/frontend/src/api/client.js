import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('apex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token has expired or is otherwise rejected by the API, don't
// leave the app stuck showing a stale "signed in" UI that just throws
// 401s on every request — clear the session and bounce back to the
// public landing page so the person can sign in again.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('apex_token')) {
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_user');
      if (!window.location.href.includes('__loggedOut')) {
        window.dispatchEvent(new CustomEvent('apex:session-expired'));
      }
    }
    return Promise.reject(err);
  }
);

export default client;
