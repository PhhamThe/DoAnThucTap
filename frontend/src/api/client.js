import axios from "axios";
const baseUrlFromEnv = import.meta.env.VITE_API_ENDPOINT || "/";


const apiClient = axios.create({
    baseURL: baseUrlFromEnv,
    headers: {
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
 
    const authToken = localStorage.getItem("token");
    if (authToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${authToken}`;
    }


    if (config.data instanceof FormData) {

        if (config.headers) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }
        if (apiClient.defaults && apiClient.defaults.headers) {
            if (apiClient.defaults.headers.common) {
                delete apiClient.defaults.headers.common["Content-Type"];
                delete apiClient.defaults.headers.common["content-type"];
            }
        }
    }

    return config;
}, (error) => Promise.reject(error));

export const apiGet = async (path, params = {}, config = {}) => {
    const response = await apiClient.get(path, { params, ...config });
    return response.data;
};

export const apiPost = async (path, payload = {}, config = {}) => {

    const response = await apiClient.post(path, payload, config);
    return response.data;
};

export const apiPut = async (path, payload = {}, config = {}) => {

    if (payload instanceof FormData) {
        payload.append("_method", "PUT");
        const response = await apiClient.post(path, payload, config);
        return response.data;
    }
    const response = await apiClient.put(path, payload, config);
    return response.data;
};

export const apiDelete = async (path, config = {}) => {
    const response = await apiClient.delete(path, config);
    return response.data;
};

export default apiClient;
