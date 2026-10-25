import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { quizService } from "../services/quizService";

const emptyQuestion = () => ({
  question: "",
  type: "mcq",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
});

export default function QuizBuilder() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[oIdx] = value;
      return { ...q, options };
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    if (!title.trim()) return alert("Quiz title required");
    if (questions.some((q) => !q.question.trim() || !q.correctAnswer.trim())) return alert("Fill all questions and correct answers");

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        questions: questions.map((q) => ({
          question: q.question.trim(),
          type: q.type,
          options: q.type === "mcq" ? q.options.filter((o) => o.trim()) : [],
          correctAnswer: q.correctAnswer.trim(),
          points: Number(q.points) || 1,
        })),
      };
      await quizService.create(groupId, payload);
      navigate(`/groups/${groupId}/quizzes`); // wapas quiz list par
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">🎯 Create Quiz</h1>
            <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Cancel</button>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz Title (e.g., Calculus Ch. 1)"
              className="w-full px-4 py-3 bg-slate-800 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-purple-500 border border-transparent"
            />
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-purple-400">Question {idx + 1}</h3>
                  {questions.length > 1 && (
                    <button onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 text-sm hover:underline">Remove</button>
                  )}
                </div>

                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                  placeholder="Question text"
                  className="w-full px-4 py-3 mb-4 bg-slate-800 rounded-xl focus:outline-none border border-transparent focus:border-purple-500"
                />

                <div className="flex gap-4 mb-4">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                    className="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="flashcard">Flashcard</option>
                  </select>
                  <input
                    type="number"
                    value={q.points}
                    onChange={(e) => updateQuestion(idx, { points: e.target.value })}
                    placeholder="Points"
                    min={1}
                    className="w-24 px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700"
                  />
                </div>

                {q.type === "mcq" && (
                  <div className="space-y-3 mb-4">
                    <p className="text-xs text-slate-400">Options (select the radio button for the correct answer)</p>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctAnswer === opt && opt.trim() !== ""}
                          onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                          className="w-4 h-4 accent-purple-500"
                        />
                        <input
                          value={opt}
                          onChange={(e) => {
                            updateOption(idx, oIdx, e.target.value);
                            if (q.correctAnswer === opt) updateQuestion(idx, { correctAnswer: e.target.value });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "flashcard" && (
                  <input
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                    placeholder="Type the correct answer here"
                    className="w-full px-4 py-3 mb-4 bg-slate-800 rounded-xl text-sm border border-slate-700"
                  />
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setQuestions([...questions, emptyQuestion()])} className="w-full mt-6 py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-purple-500 hover:text-purple-400 transition font-semibold">
            + Add Question
          </button>

          <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold text-lg disabled:opacity-50">
            {saving ? "Saving Quiz..." : "✓ Save Quiz"}
          </button>
        </div>
      </div>
    </>
  );
}