import { api } from '../api'

export const resourceService = {
  upload: (groupId, data) => api.post(`/resources/group/${groupId}`, data),
  getGroupResources: (groupId) => api.get(`/resources/group/${groupId}`),
  trackDownload: (id) => api.post(`/resources/${id}/download`),
  delete: (id) => api.delete(`/resources/${id}`),
}