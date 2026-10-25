import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { quizService } from "../services/quizService";

export default function QuizPlay() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await quizService.getById(quizId);
        setQuiz(res?.data?.quiz || res?.data);
      } catch (err) {
        alert("Failed to load quiz");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, navigate]);

  const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = quiz.questions.map(q => ({
        questionId: q._id,
        userAnswer: answers[q._id] || "",
      }));
      const res = await quizService.submit(quizId, payload, 0);
      setResult(res?.data || res);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <><Navbar /><div className="text-center py-20 text-white">Loading Quiz...</div></>;

  if (result) {
    const pct = result.percentage || 0;
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-3xl p-10 max-w-lg w-full text-center border border-slate-800 shadow-2xl">
            <div className="text-7xl mb-4">{pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "📚"}</div>
            <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
            <p className="text-slate-400 mb-8">{quiz.title}</p>

            <div className="flex justify-center gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-purple-400">{result.score}/{result.totalPoints}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">{pct.toFixed(0)}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Accuracy</div>
              </div>
            </div>

            <button onClick={() => navigate(-1)} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition">
              Back to Quizzes
            </button>
          </div>
        </div>
      </>
    );
  }

  const q = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Question {currentIdx + 1} of {quiz.questions.length}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <h2 className="text-2xl font-semibold mb-6">{q.question}</h2>

            {q.type === "mcq" ? (
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(q._id, opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      answers[q._id] === opt ? "border-purple-500 bg-purple-900/20" : "border-slate-700 bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <span className="inline-flex w-8 h-8 rounded-full bg-slate-700 items-center justify-center mr-3 font-bold text-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[q._id] || ""}
                onChange={(e) => handleAnswer(q._id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-4 py-4 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500"
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-6 py-3 rounded-xl bg-slate-800 disabled:opacity-50 font-semibold transition"
            >
              Previous
            </button>
            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold disabled:opacity-50 transition shadow-lg shadow-emerald-900/20"
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}