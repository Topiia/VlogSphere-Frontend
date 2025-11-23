import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth API methods
export const authAPI = {
  setAuthHeader: (token) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  },

  login: (credentials) => api.post("/auth/login", credentials),
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

// ------- Vlog API -------
export const vlogAPI = {
  getVlogs: (params = {}) => api.get("/vlogs", { params }),
  getVlog: (id) => api.get(`/vlogs/${id}`),
  createVlog: (data) => api.post("/vlogs", data),
  updateVlog: (id, data) => api.put(`/vlogs/${id}`, data),
  deleteVlog: (id) => api.delete(`/vlogs/${id}`),

  likeVlog: (id) => api.put(`/vlogs/${id}/like`),
  dislikeVlog: (id) => api.put(`/vlogs/${id}/dislike`),
  shareVlog: (id) => api.put(`/vlogs/${id}/share`),
  recordView: (id) => api.put(`/vlogs/${id}/view`),

  addComment: (id, text) => api.post(`/vlogs/${id}/comments`, { text }),
  deleteComment: (id, commentId) =>
    api.delete(`/vlogs/${id}/comments/${commentId}`),

  getTrending: (params = {}) => api.get("/vlogs/trending", { params }),
  getUserVlogs: (userId, params = {}) =>
    api.get(`/vlogs/user/${userId}`, { params }),
  searchVlogs: (query, params = {}) =>
    api.get(`/vlogs/search`, { params: { ...params, q: query } }),
};

// ------- Upload API -------
export const uploadAPI = {
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    return api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImage: (publicId) => api.delete(`/upload/${publicId}`),
};

// ------- User API -------
export const userAPI = {
  getUser: (username) => api.get(`/users/${username}`),
  getUserByUsername: (username) => api.get(`/users/profile/${username}`),

  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),

  getFollowers: (userId, params = {}) =>
    api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params = {}) =>
    api.get(`/users/${userId}/following`, { params }),

  searchUsers: (q, params = {}) =>
    api.get(`/users/search`, { params: { ...params, q } }),

  getLikedVlogs: (params = {}) => api.get("/users/likes", { params }),
  getBookmarks: (params = {}) => api.get("/users/bookmarks", { params }),
  addBookmark: (id) => api.post(`/users/bookmarks/${id}`),
  removeBookmark: (id) => api.delete(`/users/bookmarks/${id}`),
};

// ---------------------
// REQUEST INTERCEPTOR
// ---------------------
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }

    config.retryCount = config.retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------
// RESPONSE INTERCEPTOR (FIXED)
// ---------------------
api.interceptors.response.use(
  (res) => res,

  async (error) => {
    const original = error.config;

    // No response (network error)
    if (!error.response) {
      const maxRetries = 2;
      if (original.retryCount < maxRetries) {
        original.retryCount++;
        await new Promise((r) => setTimeout(r, 1000 * original.retryCount));
        return api(original);
      }

      error.message = "Network error. Check your connection.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // -------- 401 FIXED --------
    if (status === 401) {
      error.message =
        data?.error?.message || data?.message || "Invalid credentials";

      // Only clear tokens, do NOT reload
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");

      return Promise.reject(error);
    }

    // -------- Other status messages --------
    const message =
      data?.error?.message || data?.message || "Unexpected error occurred";

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
