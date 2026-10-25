// src/components/group/CreateGroupModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../../services/groupService";

const EMOJIS = ["📚", "🧪", "💻", "📐", "🎨", "🔬", "🌐", "💡", "📖", "🎯"];

export default function CreateGroupModal({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleCreate = async (e) => {
    e.preventDefault();

    if (loading) return;
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await groupService.create({
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim(),
        emoji,
      });

      const created =
        res?.data?.group ||
        res?.data?.data?.group ||
        res?.data?.data ||
        res?.group;

      const id = created?._id || created?.id;

      setName("");
      setDescription("");
      setSubject("");
      setEmoji("📚");
      onClose();

      if (onCreated) {
        onCreated(created);
      } else if (id) {
        navigate(`/groups/${id}`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create group"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          background: "rgba(15,20,35,0.98)",
          border: "1px solid var(--card-border)",
          borderRadius: 24,
          padding: 28,
          boxShadow:
            "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px -20px rgba(16,185,129,0.3)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: "24px 24px 0 0",
            background: "linear-gradient(90deg, #10b981, #14b8a6)",
          }}
        />

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--card-border)",
            color: "var(--text-2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            Create a new group
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            Bring your study circle together in one place
          </p>
        </div>

        <form onSubmit={handleCreate}>
          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Icon
          </label>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  fontSize: 22,
                  border:
                    emoji === e
                      ? "2px solid #10b981"
                      : "1px solid var(--card-border)",
                  background:
                    emoji === e
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Group name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Calculus 101"
            required
            autoFocus
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--card-border)",
              borderRadius: 11,
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 16,
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Subject (optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics"
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--card-border)",
              borderRadius: 11,
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 16,
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you study together?"
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--card-border)",
              borderRadius: 11,
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              marginBottom: 20,
            }}
          />

          {error && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171",
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 11,
                background: "transparent",
                border: "1px solid var(--card-border)",
                color: "var(--text-2)",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                flex: 2,
                padding: "12px 20px",
                borderRadius: 11,
                background:
                  loading || !name.trim()
                    ? "rgba(16,185,129,0.3)"
                    : "linear-gradient(135deg, #10b981, #14b8a6)",
                border: "none",
                color: "white",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: "0 6px 16px -4px rgba(16,185,129,0.5)",
              }}
            >
              {loading ? "Creating…" : "Create group →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}