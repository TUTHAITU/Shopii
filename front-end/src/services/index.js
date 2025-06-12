import axios from 'axios';
import { BACKEND_API_URI } from '../utils/constants';

axios.defaults.withCredentials = true;

const api = axios.create({
    baseURL: BACKEND_API_URI
});

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(`${BACKEND_API_URI}/user/refresh-token`);
                localStorage.setItem('accessToken', data.accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (err) {
                // console.error('Failed to refresh token:', err);
                const errorMessage = 'Failed to refresh token. Please sign in again.';
            }
        } else if (error.response.status === 403) {
            // Redirect to a custom error page with an error message
            const errorMessage = error.response.data.message || "You do not have permission to access this resource.";
            window.location.href = `/error?status=403&message=${encodeURIComponent(errorMessage)}`;
        }

        return Promise.reject(error);
    }
);

export { api };
