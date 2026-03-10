import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});

api.interceptors.request.use((cfg) => {
  const t = Cookies.get("auth_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ─── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login: (d: any) => api.post("/auth/login", d),
  register: (d: any) => api.post("/auth/register", d),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  refresh: () => api.post("/auth/refresh"),
};

// ─── Users ─────────────────────────────────────────────────
export const usersAPI = {
  list: (p?: any) => api.get("/users", { params: p }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (d: any) => api.post("/users", d),
  update: (id: string, d: any) => api.put(`/users/${id}`, d),
  stats: (id: string) => api.get(`/users/${id}/stats`),
  linkParent: (studentId: string, parentEmail: string) =>
    api.post(`/users/${studentId}/link-parent`, { parentEmail }),
  uploadAvatar: (id: string, avatarBase64: string) =>
    api.post(`/users/${id}/avatar`, { avatarBase64 }),
};

// ─── Academies ─────────────────────────────────────────────
export const academiesAPI = {
  list: (p?: any) => api.get("/academies", { params: p }),
  get: (id: string) => api.get(`/academies/${id}`),
  create: (d: any) => api.post("/academies", d),
  update: (id: string, d: any) => api.put(`/academies/${id}`, d),
  stats: (id: string) => api.get(`/academies/${id}/stats`),
  suspend: (id: string) => api.post(`/academies/${id}/suspend`),
  activate: (id: string) => api.post(`/academies/${id}/activate`),
};

// ─── Batches ───────────────────────────────────────────────
export const batchesAPI = {
  list: (p?: any) => api.get("/batches", { params: p }),
  get: (id: string) => api.get(`/batches/${id}`),
  create: (d: any) => api.post("/batches", d),
  update: (id: string, d: any) => api.put(`/batches/${id}`, d),
  delete: (id: string) => api.delete(`/batches/${id}`),
  students: (id: string) => api.get(`/batches/${id}/students`),
  enroll: (id: string, userId: string) =>
    api.post(`/batches/${id}/enroll`, { userId }),
  unenroll: (id: string, userId: string) =>
    api.delete(`/batches/${id}/enroll/${userId}`),
};

// ─── Classrooms ────────────────────────────────────────────
export const classroomsAPI = {
  list: (p?: any) => api.get("/classrooms", { params: p }),
  get: (id: string) => api.get(`/classrooms/${id}`),
  create: (d: any) => api.post("/classrooms", d),
  update: (id: string, d: any) => api.put(`/classrooms/${id}`, d),
  start: (id: string) => api.post(`/classrooms/${id}/start`),
  end: (id: string) => api.post(`/classrooms/${id}/end`),
  attendance: (id: string) => api.get(`/classrooms/${id}/attendance`),
  savePgn: (id: string, pgn: string) =>
    api.post(`/classrooms/${id}/pgn`, { pgn }),
};

// ─── Games ─────────────────────────────────────────────────
export const gamesAPI = {
  list: (p?: any) => api.get("/games", { params: p }),
  get: (id: string) => api.get(`/games/${id}`),
  create: (d: any) => api.post("/games", d),
  move: (id: string, d: any) => api.post(`/games/${id}/move`, d),
  resign: (id: string) => api.post(`/games/${id}/resign`),
  analyze: (id: string) => api.post(`/games/${id}/analyze`),
  analysis: (id: string) => api.get(`/games/${id}/analysis`),
};

// ─── Tournaments ───────────────────────────────────────────
export const tournamentsAPI = {
  list: (p?: any) => api.get("/tournaments", { params: p }),
  get: (id: string) => api.get(`/tournaments/${id}`),
  create: (d: any) => api.post("/tournaments", d),
  update: (id: string, d: any) => api.put(`/tournaments/${id}`, d),
  cancel: (id: string) => api.post(`/tournaments/${id}/cancel`),
  register: (id: string) => api.post(`/tournaments/${id}/register`),
  unregister: (id: string) => api.post(`/tournaments/${id}/unregister`),
  start: (id: string) => api.post(`/tournaments/${id}/start`),
  standings: (id: string) => api.get(`/tournaments/${id}/standings`),
  pairings: (id: string, round?: number) =>
    api.get(`/tournaments/${id}/pairings`, { params: round ? { round } : {} }),
  nextRound: (id: string) => api.post(`/tournaments/${id}/next-round`),
  setResult: (id: string, matchId: string, result: string) =>
    api.put(`/tournaments/${id}/matches/${matchId}/result`, { result }),
};

// ─── Puzzles ───────────────────────────────────────────────
export const puzzlesAPI = {
  daily: () => api.get("/puzzles/daily"),
  random: (p?: any) => api.get("/puzzles/random", { params: p }),
  submit: (id: string, d: any) => api.post(`/puzzles/${id}/submit`, d),
};

// ─── Assignments ───────────────────────────────────────────
export const assignmentsAPI = {
  list: (p?: any) => api.get("/assignments", { params: p }),
  create: (d: any) => api.post("/assignments", d),
  get: (id: string) => api.get(`/assignments/${id}`),
  update: (id: string, d: any) => api.put(`/assignments/${id}`, d),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  submit: (id: string, d: any) => api.post(`/assignments/${id}/submit`, d),
  submissions: (id: string) => api.get(`/assignments/${id}/submissions`),
  grade: (id: string, submissionId: string, d: any) =>
    api.put(`/assignments/${id}/submissions/${submissionId}/grade`, d),
};

// ─── Notifications ─────────────────────────────────────────
export const notificationsAPI = {
  list: (p?: any) => api.get("/notifications", { params: p }),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ─── Analytics ─────────────────────────────────────────────
export const analyticsAPI = {
  student: (id: string, p?: any) =>
    api.get(`/analytics/students/${id}`, { params: p }),
  academy: (id: string, p?: any) =>
    api.get(`/analytics/academies/${id}`, { params: p }),
  coaches: (id: string, p?: any) =>
    api.get(`/analytics/coaches/${id}`, { params: p }),
  global: (p?: any) => api.get("/analytics/global", { params: p }),
};

// ─── Billing ───────────────────────────────────────────────
export const billingAPI = {
  plans: () => api.get("/billing/plans"),
  invoices: (academyId: string) => api.get(`/billing/invoices/${academyId}`),
  upgrade: (academyId: string, plan: string) =>
    api.post(`/billing/upgrade`, { academyId, plan }),
};

// ─── Content ───────────────────────────────────────────────
export const contentAPI = {
  lessons: (p?: any) => api.get("/content/lessons", { params: p }),
  getLesson: (id: string) => api.get(`/content/lessons/${id}`),
};

// ─── Anti-Cheat ────────────────────────────────────────────
export const anticheatAPI = {
  reports: (p?: any) => api.get("/anticheat/reports", { params: p }),
  review: (id: string, d: any) => api.put(`/anticheat/reports/${id}`, d),
};

// ─── Announcements ──────────────────────────────────────────────
export const announcementsAPI = {
  list: (params?: any) => api.get("/announcements", { params }),
  listAll: () => api.get("/announcements/all"),
  create: (data: any) => api.post("/announcements", data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  remove: (id: string) => api.delete(`/announcements/${id}`),
  pin: (id: string, pinned: boolean) =>
    api.put(`/announcements/${id}/pin`, { pinned }),
};

export default api;

// ─── Messages ──────────────────────────────────────────────
export const messagesAPI = {
  conversations: () => api.get("/messages/conversations"),
  getMessages: (userId: string) => api.get(`/messages/${userId}`),
  send: (receiverId: string, content: string) =>
    api.post("/messages", { receiverId, content }),
  contacts: () => api.get("/messages/contacts/list"),
};

// ─── Extended Users ────────────────────────────────────────
export const extUsersAPI = {
  ratingHistory: (id: string, limit = 30) =>
    api.get(`/users/${id}/rating-history`, { params: { limit } }),
  myChildren: () => api.get("/users/my-children"),
  attendance: (id: string) => api.get(`/users/${id}/attendance`),
  leaderboard: (academyId: string) =>
    api.get(`/users/leaderboard/${academyId}`),
  childrenProgress: (parentId: string) =>
    api.get(`/users/children/${parentId}/progress`),
  updateStatus: (id: string, active: boolean) =>
    api.put(`/users/${id}/status`, { active }),
};

// ─── Extended Content ──────────────────────────────────────
export const contentExtAPI = {
  lessons: (p?: any) => api.get("/content/lessons", { params: p }),
  myLessons: (p?: any) => api.get("/content/lessons/mine", { params: p }),
  getLesson: (id: string) => api.get(`/content/lessons/${id}`),
  createLesson: (d: any) => api.post("/content/lessons", d),
  updateLesson: (id: string, d: any) => api.put(`/content/lessons/${id}`, d),
  publishLesson: (id: string, publish: boolean) =>
    api.put(`/content/lessons/${id}/publish`, { publish }),
  deleteLesson: (id: string) => api.delete(`/content/lessons/${id}`),
  completeLesson: (id: string) => api.post(`/content/lessons/${id}/complete`),
  myProgress: () => api.get("/content/my-progress"),
  courses: (p?: any) => api.get("/content/courses", { params: p }),
  createCourse: (d: any) => api.post("/content/courses", d),
  addToCourse: (courseId: string, lessonId: string, orderIndex?: number) =>
    api.post(`/content/courses/${courseId}/lessons`, { lessonId, orderIndex }),
};

// ─── Extended Billing ──────────────────────────────────────
export const billingExtAPI = {
  subscription: (academyId: string) =>
    api.get(`/billing/subscription/${academyId}`),
  myInvoices: () => api.get("/billing/my-invoices"),
  invoices: (academyId: string) => api.get(`/billing/invoices/${academyId}`),
  changePlan: (academyId: string, planName: string) =>
    api.post("/billing/change-plan", { academyId, planName }),
  createOrder: (data: any) => api.post("/billing/razorpay/create-order", data),
  verifyPayment: (data: any) => api.post("/billing/razorpay/verify", data),
};

// ─── Activity Logs ──────────────────────────────────────────
export const activityLogsAPI = {
  list: (p?: any) => api.get("/activity-logs", { params: p }),
};
