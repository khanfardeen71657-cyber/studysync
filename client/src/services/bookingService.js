import { api } from '../api'

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getTutorBookings: () => api.get('/bookings/tutor'),
  updateStatus: (id, status, reason) =>
    api.put(`/bookings/${id}/status`, { status, cancellationReason: reason }),
  getAvailability: (tutorId, date) =>
    api.get(`/bookings/availability/${tutorId}`, { params: { date } }),
}