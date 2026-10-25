import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { quizService } from '../services/quizService'
import Navbar from '../components/layout/Navbar.jsx'
import Loader from '../components/common/Loader.jsx'
import PageTheme from '../components/common/PageTheme.jsx'

export default function QuizLeaderboard() {
  const { quizId } = useParams()
  const [scores, setScores] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      quizService.getById(quizId),
      quizService.getLeaderboard(quizId),
    ])
      .then(([qRes, sRes]) => {
        setQuiz(qRes.data.data.quiz)
        setScores(sRes.data.data.scores)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [quizId])

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

  const getMedal = (idx) => {
    if (idx === 0) return { emoji: '🥇', grad: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }
    if (idx === 1) return { emoji: '🥈', grad: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }
    if (idx === 2) return { emoji: '🥉', grad: 'linear-gradient(135deg, #d97706, #b45309)' }
    return { emoji: `#${idx + 1}`, grad: 'linear-gradient(135deg, #4b5563, #374151)' }
  }

  return (
    <div className="relative z-10 min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-[700px] mx-auto">

          <Link
            to={`/groups/${quiz?.group}/quizzes`}
            className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-100 transition mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="text-center mb-10">
            <div className="text-[48px] mb-3">🏆</div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-[11.5px] font-semibold text-slate-500 tracking-[0.12em] uppercase">
                Leaderboard
              </span>
            </div>
            <h1 className="text-[32px] font-extrabold tracking-[-0.03em] mb-2 text-slate-100">
              {quiz?.title}
            </h1>
            <p className="text-slate-400 text-[14px]">
              {scores.length} {scores.length === 1 ? 'attempt' : 'attempts'}
            </p>
          </div>

          {scores.length === 0 ? (
            <div
              className="rounded-2xl border border-white/[0.06] p-12 text-center"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))' }}
            >
              <div className="text-[40px] mb-3">📭</div>
              <h3 className="text-[16px] font-bold text-slate-100 mb-2">No attempts yet</h3>
              <p className="text-[13.5px] text-slate-500">Be the first one to take this quiz!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scores.map((s, idx) => {
                const medal = getMedal(idx)
                return (
                  <div
                    key={s._id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] transition hover:-translate-y-0.5 hover:border-white/[0.12]"
                    style={{
                      background: idx < 3
                        ? 'linear-gradient(135deg, rgba(124, 92, 255, 0.06), rgba(255, 255, 255, 0.01))'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))',
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-bold text-white flex-shrink-0"
                      style={{ background: medal.grad, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                    >
                      {medal.emoji}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#ec4899] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                      {s.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    {/* Name + stats */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-slate-100 truncate">
                        {s.user?.name || 'Unknown'}
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        {s.score}/{s.totalPoints} points · {Math.round(s.percentage)}%
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className="text-[22px] font-extrabold tracking-[-0.03em]"
                        style={{
                          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {Math.round(s.percentage)}%
                      </div>
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