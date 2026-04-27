import axios from 'axios';

const apiClient = axios.create({
    baseURL: "/api",
    withCredentials: false
});

// Add a request interceptor to include the JWT token in headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');

            // Fire a custom event so AuthContext can react (clear state + redirect)
            // Include the response code so AuthContext can show the right message
            const code = error.response?.data?.code || 'UNAUTHORIZED';
            window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { code } }));
        }
        return Promise.reject(error);
    }
);

export default apiClient;
