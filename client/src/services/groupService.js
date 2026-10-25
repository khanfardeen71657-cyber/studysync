// src/services/groupService.js
import { api } from "../api";

export const groupService = {
  // Groups
  getAll: () => api.get("/groups"),
  getMyGroups: () => api.get("/groups"),
  getById: (id) => api.get(`/groups/${id}`),
  create: (body) => api.post("/groups", body),
  update: (id, body) => api.patch(`/groups/${id}`, body),
  delete: (id) => api.del(`/groups/${id}`),
  joinByInvite: (inviteCode) => api.post(`/groups/join/${inviteCode}`),
  previewByInvite: (inviteCode) => api.get(`/groups/preview/${inviteCode}`),
  regenerateInvite: (id) => api.post(`/groups/${id}/regenerate-invite`),
  removeMember: (id, userId) => api.del(`/groups/${id}/members/${userId}`),
  changeRole: (id, userId, role) =>
    api.patch(`/groups/${id}/members/${userId}/role`, { role }),
  leave: (id) => api.post(`/groups/${id}/leave`),
  transferAdmin: (id, newAdminId) =>
    api.post(`/groups/${id}/transfer-admin`, { newAdminId }),

  // Messages
  getMessages: (id) => api.get(`/groups/${id}/messages`),
  postMessage: (id, text) => api.post(`/groups/${id}/messages`, { text }),

  // Whiteboard
  saveWhiteboard: (id, strokes, replace = false) =>
    api.post(`/groups/${id}/whiteboard/save`, { strokes, replace }),
  clearWhiteboard: (id) => api.post(`/groups/${id}/whiteboard/clear`),

  // Goal / Lock
  updateGoal: (id, goal) => api.patch(`/groups/${id}/goal`, { goal }),
  setLock: (id, locked) => api.patch(`/groups/${id}/lock`, { locked }),

  // Quizzes
  getQuizzes: (id) => api.get(`/groups/${id}/quizzes`),
  createQuiz: (id, body) => api.post(`/groups/${id}/quizzes`, body),

  // Resources
  getResources: (id) => api.get(`/groups/${id}/resources`),
};