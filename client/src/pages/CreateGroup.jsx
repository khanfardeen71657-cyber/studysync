// client/src/pages/CreateGroup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import { groupService } from "../services/groupService";

export default function CreateGroup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    subject: "",
    emoji: "📚",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Group name must be at least 2 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await groupService.create(form);
      const group = res?.data?.data?.group || res?.data?.group;
      if (group?._id) {
        navigate(`/groups/${group._id}`);
      } else {
        navigate("/groups");
      }
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Study Group</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Group Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 rounded px-3 py-2"
                placeholder="e.g., Physics Study Group"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-slate-800 rounded px-3 py-2"
                placeholder="What is this group about?"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-slate-800 rounded px-3 py-2"
                placeholder="e.g., Physics"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/groups")}
                className="px-4 py-2 bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}