import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { quizService } from '../services/quizService'
import { groupService } from '../services/groupService'
import Navbar from '../components/layout/Navbar.jsx'
import Loader from '../components/common/Loader.jsx'
import PageTheme from '../components/common/PageTheme.jsx'

export default function QuizList() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      groupService.getById(groupId),
      quizService.getGroupQuizzes(groupId),
    ])
      .then(([gRes, qRes]) => {
        setGroup(gRes.data.data.group)
        setQuizzes(qRes.data.data.quizzes)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [groupId])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-32">
          <Loader />
        </div>
      </>
    )
  }

  return (
    <div className="relative z-10 min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-[1100px] mx-auto">

          {/* Breadcrumb */}
          <Link
            to={`/groups/${groupId}`}
            className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-100 transition mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to {group?.name || 'Group'}
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-[11.5px] font-semibold text-slate-500 tracking-[0.12em] uppercase">
                  Quizzes
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[11.5px] font-medium text-slate-500">
                  {group?.name}
                </span>
              </div>
              <h1 className="text-[36px] md:text-[42px] font-extrabold tracking-[-0.03em] leading-tight mb-2 text-slate-100">
                Test your <span className="section-title-gradient">knowledge</span>
              </h1>
              <p className="text-slate-400 text-[15px]">
                {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available
              </p>
            </div>

            <Link
              to={`/groups/${groupId}/quizzes/new`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Quiz
            </Link>
          </div>

          {/* Empty State */}
          {quizzes.length === 0 ? (
            <div
              className="rounded-2xl border border-white/[0.06] p-12 text-center"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))' }}
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-slate-100 mb-2">No quizzes yet</h3>
              <p className="text-[13.5px] text-slate-500 mb-6 max-w-[340px] mx-auto">
                Create your first quiz to test your group's knowledge
              </p>
              <Link
                to={`/groups/${groupId}/quizzes/new`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13.5px] font-semibold transition hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                  boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create your first quiz
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q, i) => {
                const gradients = [
                  'linear-gradient(135deg, #6366f1, #7c5cff)',
                  'linear-gradient(135deg, #ec4899, #db2777)',
                  'linear-gradient(135deg, #10b981, #059669)',
                  'linear-gradient(135deg, #f59e0b, #d97706)',
                  'linear-gradient(135deg, #06b6d4, #0891b2)',
                ]
                const grad = gradients[i % gradients.length]

                return (
                  <div
                    key={q._id}
                    className="group relative rounded-2xl border border-white/[0.06] p-5 overflow-hidden transition-all hover:-translate-y-1 hover:border-white/[0.12]"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
                  >
                    <div className="flex items-start gap-3.5 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                        style={{ background: grad, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)' }}
                      >
                        🎯
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15.5px] font-bold tracking-[-0.015em] text-slate-100 mb-1 truncate">
                          {q.title}
                        </h3>
                        <p className="text-[12px] text-slate-500 truncate">
                          {q.questions?.length || 0} questions · {q.totalPoints || 0} pts
                        </p>
                      </div>
                    </div>

                    <p className="text-[13px] text-slate-400 mb-4 line-clamp-2 leading-relaxed min-h-[40px]">
                      {q.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center gap-3 text-[11.5px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {q.timeLimit ? `${q.timeLimit}min` : 'No limit'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          {q.attempts || 0} attempts
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        to={`/quizzes/${q._id}`}
                        className="flex-1 text-center py-2 rounded-lg text-[12.5px] font-semibold text-white transition"
                        style={{
                          background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                          boxShadow: '0 4px 12px rgba(124, 92, 255, 0.3)',
                        }}
                      >
                        Take Quiz
                      </Link>
                      <Link
                        to={`/quizzes/${q._id}/leaderboard`}
                        className="px-3 py-2 rounded-lg text-[12.5px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition"
                        title="Leaderboard"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}