// client/src/services/tutorService.js
import { api } from "../api";

export const tutorService = {
  // ═══════════════════════════════════════════════════════════════
  // TUTORS
  // ═══════════════════════════════════════════════════════════════
  getTutors: (params = {}) => api.get("/tutors", { params }),
  list: (params = {}) => api.get("/tutors", { params }),
  getTutorById: (id) => api.get(`/tutors/${id}`),
  getById: (id) => api.get(`/tutors/${id}`),
  registerTutor: (data) => api.post("/tutors", data),
  createTutorProfile: (data) => api.post("/tutors", data),
  getMyTutorProfile: () => api.get("/tutors/me"),
  getMyProfile: () => api.get("/tutors/me"),
  updateTutorProfile: (data) => api.patch("/tutors/me", data),
  update: (data) => api.patch("/tutors/me", data),
  getTutorBookings: (tutorId) => api.get(`/tutors/${tutorId}/bookings`),

  // ═══════════════════════════════════════════════════════════════
  // ✅ AVATAR UPLOAD
  // ═══════════════════════════════════════════════════════════════
  uploadAvatar: (formData) =>
    api.post("/tutors/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ═══════════════════════════════════════════════════════════════
  // BOOKINGS
  // ═══════════════════════════════════════════════════════════════
  createBooking: (data) => api.post("/bookings", data),
  getMyBookings: (role = "student") => api.get(`/bookings/me?role=${role}`),
  updateBookingStatus: (id, status, reason = "") =>
    api.patch(`/bookings/${id}/status`, { status, reason }),
  setMeetingLink: (id, meetingLink) =>
    api.patch(`/bookings/${id}/meeting-link`, { meetingLink }),

  // ═══════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════
  createReview: (data) => api.post("/reviews", data),
  getTutorReviews: (tutorId) => api.get(`/tutors/${tutorId}/reviews`),

  // ═══════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════
  listPendingTutors: () => api.get("/admin/tutors/pending"),
  listAllTutors: () => api.get("/admin/tutors"),
  verifyTutor: (tutorId, isVerified) =>
    api.patch(`/admin/tutors/${tutorId}/verify`, { isVerified }),
};

export default tutorService;