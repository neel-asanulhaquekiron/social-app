import { api } from "./apiClient";

export const getUserData = (userId) => api.get(`/users/${userId}`);
