// client/src/components/tutor/BookTutorModal.jsx
import { useEffect, useMemo, useState } from "react";
import { tutorService } from "../../services/tutorService.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEFAULT_SLOTS = [
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:00" },
];

const DURATIONS = [30, 45, 60, 90];

const pad = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getTutorSlotsForDate = (tutor, date) => {
  if (!tutor?.availability?.length) return DEFAULT_SLOTS;
  const dayName = DAYS[date.getDay()];
  const match = tutor.availability.find((a) => a.day === dayName);
  if (!match || !match.slots?.length) return [];
  return match.slots;
};

export default function BookTutorModal({ tutor, onClose, onBooked }) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ✅ Booked slots track karo
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingBooked, setLoadingBooked] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ✅ Tutor ki saari bookings fetch karo (booked slots pata karne ke liye)
  useEffect(() => {
    if (!tutor?._id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingBooked(true);
        // Saari bookings fetch karo is tutor ki
        const res = await tutorService.getTutorBookings?.(tutor._id);
        const list =
          res?.data?.data?.bookings ||
          res?.data?.bookings ||
          [];

        if (!cancelled) {
          // Sirf pending/confirmed bookings lo
          const active = (Array.isArray(list) ? list : []).filter(
            (b) => b.status === "pending" || b.status === "confirmed"
          );
          setBookedSlots(active);
        }
      } catch (err) {
        // Agar API nahi hai toh ignore karo
        console.warn("Could not fetch tutor bookings:", err.message);
      } finally {
        if (!cancelled) setLoadingBooked(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tutor?._id]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const startWeekday = first.getDay();
    const days = [];

    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewMonth]);

  const canGoPrev =
    viewMonth.getFullYear() > today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() > today.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const goNext = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const isPast = (d) => d < today;

  // ✅ Check karo slot booked hai ya nahi
  const isSlotBooked = (date, slot) => {
    const dateStr = toISODate(date);
    return bookedSlots.some((b) => {
      const bDate = new Date(b.date);
      return (
        toISODate(bDate) === dateStr &&
        b.startTime === slot.startTime
      );
    });
  };

  // ✅ Available slots (booked exclude)
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const allSlots = getTutorSlotsForDate(tutor, selectedDate);
    return allSlots.filter((s) => !isSlotBooked(selectedDate, s));
  }, [selectedDate, tutor, bookedSlots]);

  // ✅ Date pe koi slot available hai ya nahi
  const hasAvailableSlots = (date) => {
    const allSlots = getTutorSlotsForDate(tutor, date);
    return allSlots.some((s) => !isSlotBooked(date, s));
  };

  const amount = useMemo(() => {
    const rate = Number(tutor?.hourlyRate || 0);
    return Math.round((rate * duration) / 60 * 100) / 100;
  }, [tutor?.hourlyRate, duration]);

  const handleSelectDate = (d) => {
    if (!d || isPast(d)) return;
    if (!hasAvailableSlots(d)) return; // koi slot free nahi
    setSelectedDate(d);
    setSelectedSlot(null);
    setError("");
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      setError("Please select a date and a time slot.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        tutorId: tutor._id,
        date: toISODate(selectedDate),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        duration,
        notes,
      };
      await tutorService.createBooking(payload);
      onBooked?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not create booking. Try another slot.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Book a session with {tutor?.user?.name || "Tutor"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              ${tutor?.hourlyRate || 0}/hr · Select a date & time
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Calendar */}
          <div className="p-5 border-r border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goPrev}
                disabled={!canGoPrev}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-800"
              >
                ‹
              </button>
              <div className="text-white font-semibold">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </div>
              <button
                onClick={goNext}
                className="w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-slate-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                if (!d) return <div key={i} />;
                const past = isPast(d);
                const selected = selectedDate && isSameDay(d, selectedDate);
                const slots = getTutorSlotsForDate(tutor, d);
                const hasFree = slots.length > 0 && !past && hasAvailableSlots(d);

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDate(d)}
                    disabled={past || !hasFree}
                    className={[
                      "h-10 rounded-lg text-sm font-medium transition",
                      selected
                        ? "bg-purple-600 text-white"
                        : past || !hasFree
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-200 hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Grey dates = no availability or past.
            </p>
            {loadingBooked && (
              <p className="text-xs text-purple-400 mt-1">
                ⏳ Checking available slots...
              </p>
            )}
          </div>

          {/* Right panel */}
          <div className="p-5">
            {!selectedDate ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-slate-400 text-sm">
                  Pick a date on the calendar to see available time slots.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    Selected date
                  </div>
                  <div className="text-white font-semibold">
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Available time slots
                  </div>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-amber-400">
                      ⚠️ All slots on this day are booked. Try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((s) => {
                        const active = selectedSlot?.startTime === s.startTime;
                        return (
                          <button
                            key={s.startTime}
                            onClick={() => setSelectedSlot(s)}
                            className={[
                              "px-3 py-2 rounded-lg text-sm border transition",
                              active
                                ? "bg-purple-600 border-purple-500 text-white"
                                : "border-slate-700 text-slate-200 hover:bg-slate-800",
                            ].join(" ")}
                          >
                            {s.startTime} – {s.endTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Duration
                  </div>
                  <div className="flex gap-2">
                    {DURATIONS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setDuration(m)}
                        className={[
                          "flex-1 px-3 py-2 rounded-lg text-sm border transition",
                          duration === m
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "border-slate-700 text-slate-200 hover:bg-slate-800",
                        ].join(" ")}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                    Notes (optional)
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Topic you want to cover..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-lg font-bold text-white">
                      ${amount}
                    </div>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedSlot || submitting}
                    className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold"
                  >
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}