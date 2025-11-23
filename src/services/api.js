// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ----------------------------------------
// AUTH / APP API EXPORTS
// ----------------------------------------
export const authAPI = {
  setAuthHeader: (token) => {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
  },

  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateDetails: (data) => api.put("/auth/updatedetails", data),
  updatePassword: (data) => api.put("/auth/updatepassword", data),
  forgotPassword: (email) => api.post("/auth/forgotpassword", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/resetpassword/${token}`, { password }),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
};

export const vlogAPI = {
  getVlogs: (params = {}) => api.get("/vlogs", { params }),
  getVlog: (id) => api.get(`/vlogs/${id}`),
  createVlog: (vlogData) => api.post("/vlogs", vlogData),
  updateVlog: (id, vlogData) => api.put(`/vlogs/${id}`, vlogData),
  deleteVlog: (id) => api.delete(`/vlogs/${id}`),
  likeVlog: (id) => api.put(`/vlogs/${id}/like`),
  dislikeVlog: (id) => api.put(`/vlogs/${id}/dislike`),
  addComment: (id, comment) => api.post(`/vlogs/${id}/comments`, { text: comment }),
  deleteComment: (id, commentId) => api.delete(`/vlogs/${id}/comments/${commentId}`),
  shareVlog: (id) => api.put(`/vlogs/${id}/share`),
  recordView: (id) => api.put(`/vlogs/${id}/view`),
  getTrending: (params = {}) => api.get("/vlogs/trending", { params }),
  getUserVlogs: (userId, params = {}) => api.get(`/vlogs/user/${userId}`, { params }),
  searchVlogs: (query, params = {}) => api.get("/vlogs/search", { params: { ...params, q: query } }),
};

export const uploadAPI = {
  uploadSingle: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  uploadMultiple: (files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api.post("/upload/multiple", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  deleteImage: (publicId) => api.delete(`/upload/${publicId}`),
};

export const userAPI = {
  getUser: (username) => api.get(`/users/${username}`),
  getUserByUsername: (username) => api.get(`/users/profile/${username}`),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId, params = {}) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params = {}) => api.get(`/users/${userId}/following`, { params }),
  searchUsers: (query, params = {}) => api.get("/users/search", { params: { ...params, q: query } }),
  getLikedVlogs: (params = {}) => api.get("/users/likes", { params }),
  getBookmarks: (params = {}) => api.get("/users/bookmarks", { params }),
  addBookmark: (vlogId) => api.post(`/users/bookmarks/${vlogId}`),
  removeBookmark: (vlogId) => api.delete(`/users/bookmarks/${vlogId}`),
};

// ----------------------------------------
// Request interceptor (minimal-safe)
// ----------------------------------------
api.interceptors.request.use(
  (config) => {
    // NOTE: do not mutate POST calls or cause duplicates.
    // Add a small timestamp only for GETs if needed by cache-busting,
    // but avoid automatic side-effects for non-GET methods.
    if (config && config.method === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------
// Response interceptor (sane error propagation)
// ----------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If no response then it's network error
    if (!error.response) {
      error.message = "Network error. Check your connection.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.error?.message || data?.message || null;

    // Do NOT automatically redirect the whole app here.
    // Let calling code (AuthContext or components) handle 401s gracefully.
    error.message = serverMessage || `Request failed with status ${status}`;

    return Promise.reject(error);
  }
);

export default api;
