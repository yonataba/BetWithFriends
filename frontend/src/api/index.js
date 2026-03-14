import api from "./client";

export const authApi = {
  googleLogin: (idToken) =>
    api.post("/auth/google/", { access_token: idToken, id_token: idToken }),

  emailLogin: (email, password) =>
    api.post("/auth/login/", { email, password }),

  getCurrentUser: () => api.get("/auth/me/"),

  updateProfile: (data) => api.patch("/auth/me/", data),

  logout: () => api.post("/auth/logout/"),
};

export const groupsApi = {
  list: () => api.get("/groups/"),
  create: (data) => api.post("/groups/", data),
  get: (id) => api.get(`/groups/${id}/`),
  update: (id, data) => api.patch(`/groups/${id}/`, data),
  delete: (id) => api.delete(`/groups/${id}/`),
  joinByCode: (code) => api.post("/groups/join/", { code }),
  regenerateCode: (id) => api.post(`/groups/${id}/regenerate-code/`),
  getMembers: (id) => api.get(`/groups/${id}/members/`),
  removeMember: (groupId, userId) =>
    api.delete(`/groups/${groupId}/members/${userId}/remove/`),
  updateMemberRole: (groupId, userId, role) =>
    api.patch(`/groups/${groupId}/members/${userId}/`, { role }),
};

export const betsApi = {
  list: (groupId) => api.get(`/groups/${groupId}/bets/`),
  listMine: (statusFilter) =>
    api.get("/bets/my/", { params: statusFilter ? { status: statusFilter } : {} }),
  create: (groupId, data) => api.post(`/groups/${groupId}/bets/`, data),
  get: (groupId, betId) => api.get(`/groups/${groupId}/bets/${betId}/`),
  update: (groupId, betId, data) =>
    api.patch(`/groups/${groupId}/bets/${betId}/`, data),
  resolve: (groupId, betId, data) =>
    api.post(`/groups/${groupId}/bets/${betId}/resolve/`, data),
  cancel: (groupId, betId) => api.delete(`/groups/${groupId}/bets/${betId}/`),
  accept: (groupId, betId) => api.post(`/groups/${groupId}/bets/${betId}/accept/`),
  reject: (groupId, betId) => api.post(`/groups/${groupId}/bets/${betId}/reject/`),
  counter: (groupId, betId, data) => api.post(`/groups/${groupId}/bets/${betId}/counter/`, data),
  listPendingForMe: () => api.get("/bets/my/", { params: { awaiting_me: true } }),
};

export const currenciesApi = {
  list: () => api.get("/currencies/"),
  create: (data) => api.post("/currencies/", data),
  delete: (code) => api.delete(`/currencies/${code}/`),
};
