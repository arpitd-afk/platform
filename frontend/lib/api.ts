import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Auto refresh on 401
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        original.headers["Authorization"] = `Bearer ${data.token}`;
        return api(original);
      } catch {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// API service methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};

export const academyAPI = {
  getAll: (params?: any) => api.get("/academies", { params }),
  getById: (id: string) => api.get(`/academies/${id}`),
  create: (data: any) => api.post("/academies", data),
  update: (id: string, data: any) => api.put(`/academies/${id}`, data),
  delete: (id: string) => api.delete(`/academies/${id}`),
  suspend: (id: string) => api.post(`/academies/${id}/suspend`),
  activate: (id: string) => api.post(`/academies/${id}/activate`),
  getStats: (id: string) => api.get(`/academies/${id}/stats`),
  getStudents: (id: string, params?: any) =>
    api.get(`/academies/${id}/students`, { params }),
  getCoaches: (id: string) => api.get(`/academies/${id}/coaches`),
};

export const userAPI = {
  getAll: (params?: any) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.put(`/users/${id}`, data),
  updateAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.put(`/users/${id}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getStats: (id: string) => api.get(`/users/${id}/stats`),
  getGameHistory: (id: string, params?: any) =>
    api.get(`/users/${id}/games`, { params }),
};

export const classroomAPI = {
  getAll: (params?: any) => api.get("/classrooms", { params }),
  getById: (id: string) => api.get(`/classrooms/${id}`),
  create: (data: any) => api.post("/classrooms", data),
  update: (id: string, data: any) => api.put(`/classrooms/${id}`, data),
  delete: (id: string) => api.delete(`/classrooms/${id}`),
  join: (id: string) => api.post(`/classrooms/${id}/join`),
  getAttendance: (id: string) => api.get(`/classrooms/${id}/attendance`),
  markAttendance: (id: string, data: any) =>
    api.post(`/classrooms/${id}/attendance`, data),
};

export const gameAPI = {
  create: (data: any) => api.post("/games", data),
  getById: (id: string) => api.get(`/games/${id}`),
  getAll: (params?: any) => api.get("/games", { params }),
  makeMove: (id: string, move: string) =>
    api.post(`/games/${id}/move`, { move }),
  resign: (id: string) => api.post(`/games/${id}/resign`),
  offerDraw: (id: string) => api.post(`/games/${id}/draw`),
  analyze: (id: string) => api.post(`/games/${id}/analyze`),
  getAnalysis: (id: string) => api.get(`/games/${id}/analysis`),
};

export const tournamentAPI = {
  getAll: (params?: any) => api.get("/tournaments", { params }),
  getById: (id: string) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post("/tournaments", data),
  update: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  register: (id: string) => api.post(`/tournaments/${id}/register`),
  unregister: (id: string) => api.post(`/tournaments/${id}/unregister`),
  start: (id: string) => api.post(`/tournaments/${id}/start`),
  pairRound: (id: string) => api.post(`/tournaments/${id}/pair`),
  getStandings: (id: string) => api.get(`/tournaments/${id}/standings`),
  getGames: (id: string, round?: number) =>
    api.get(`/tournaments/${id}/games`, { params: { round } }),
};

export const assignmentAPI = {
  getAll: (params?: any) => api.get("/assignments", { params }),
  getById: (id: string) => api.get(`/assignments/${id}`),
  create: (data: any) => api.post("/assignments", data),
  submit: (id: string, data: any) =>
    api.post(`/assignments/${id}/submit`, data),
  grade: (id: string, submissionId: string, data: any) =>
    api.put(`/assignments/${id}/submissions/${submissionId}`, data),
};

export const analyticsAPI = {
  getStudentStats: (studentId: string, period?: string) =>
    api.get(`/analytics/students/${studentId}`, { params: { period } }),
  getAcademyStats: (academyId: string) =>
    api.get(`/analytics/academies/${academyId}`),
  getGlobalStats: () => api.get("/analytics/global"),
  getRatingHistory: (userId: string) =>
    api.get(`/analytics/users/${userId}/rating`),
  getOpeningStats: (userId: string) =>
    api.get(`/analytics/users/${userId}/openings`),
};

export const billingAPI = {
  getPlans: () => api.get("/billing/plans"),
  subscribe: (planId: string, academyId: string) =>
    api.post("/billing/subscribe", { planId, academyId }),
  getInvoices: (academyId: string) => api.get(`/billing/invoices/${academyId}`),
  cancelSubscription: (academyId: string) =>
    api.post(`/billing/cancel/${academyId}`),
  getUsage: (academyId: string) => api.get(`/billing/usage/${academyId}`),
};

export const puzzleAPI = {
  getDaily: () => api.get("/puzzles/daily"),
  getRandom: (difficulty?: string) =>
    api.get("/puzzles/random", { params: { difficulty } }),
  submit: (id: string, moves: string[]) =>
    api.post(`/puzzles/${id}/submit`, { moves }),
  getHistory: (userId: string) => api.get(`/puzzles/history/${userId}`),
};

export const notificationAPI = {
  getAll: (params?: any) => api.get("/notifications", { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
};
