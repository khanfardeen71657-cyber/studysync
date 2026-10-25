// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Loader from './components/common/Loader.jsx'
import CommandPalette from './components/common/CommandPalette.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Groups from './pages/Groups.jsx'
import GroupDetail from './pages/GroupDetail.jsx'
import StudyRoom from './pages/StudyRoom.jsx'
import Tutors from './pages/Tutors.jsx'
import TutorDetail from './pages/TutorDetail.jsx'
import TutorProfileSetup from './pages/TutorProfileSetup.jsx'
import TutorProfile from './pages/TutorProfile.jsx'
import JoinGroup from './pages/JoinGroup.jsx'
import QuizList from './pages/QuizList.jsx'
import QuizBuilder from './pages/QuizBuilder.jsx'
import QuizPlay from './pages/QuizPlay.jsx'
import QuizLeaderboard from './pages/QuizLeaderboard.jsx'
import NotFound from './pages/NotFound.jsx'
import MyBookings from './pages/MyBookings.jsx'
import TutorDashboard from './pages/TutorDashboard.jsx'
import AdminTutors from './pages/AdminTutors.jsx'
import CreateGroup from './pages/CreateGroup.jsx'   // ✅ naya import

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullscreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullscreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <CommandPalette />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* ✅ Groups — specific routes PEHLE */}
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
        <Route path="/groups/:id/room" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />

        <Route path="/tutors" element={<Tutors />} />
        <Route path="/tutors/:id" element={<TutorDetail />} />
        <Route path="/become-tutor" element={<ProtectedRoute><TutorProfileSetup /></ProtectedRoute>} />
        <Route path="/tutor-profile" element={<ProtectedRoute><TutorProfile /></ProtectedRoute>} />
        <Route path="/tutor-profile/edit" element={<ProtectedRoute><TutorProfileSetup /></ProtectedRoute>} />

        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/tutor-dashboard" element={<ProtectedRoute><TutorDashboard /></ProtectedRoute>} />

        {/* ✅ Admin */}
        <Route path="/admin/tutors" element={<ProtectedRoute><AdminTutors /></ProtectedRoute>} />

        <Route path="/groups/:groupId/quizzes" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
        <Route path="/groups/:groupId/quizzes/new" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
        <Route path="/quizzes/:quizId" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
        <Route path="/quizzes/:quizId/leaderboard" element={<ProtectedRoute><QuizLeaderboard /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  )
}