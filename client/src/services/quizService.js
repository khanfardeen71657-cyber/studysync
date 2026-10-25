// src/services/quizService.js
import { api } from "../api";

export const quizService = {
  // Group quizzes
  create: (groupId, body) => api.post(`/groups/${groupId}/quizzes`, body),
  getGroupQuizzes: (groupId) => api.get(`/groups/${groupId}/quizzes`),

  // Single quiz
  getById: (id) => api.get(`/quizzes/${id}`),
  submit: (id, answers, timeTaken) =>
    api.post(`/quizzes/${id}/submit`, { answers, timeTaken }),
  getLeaderboard: (id) => api.get(`/quizzes/${id}/leaderboard`),
  getMyAttempts: () => api.get(`/quizzes/me/attempts`),
};