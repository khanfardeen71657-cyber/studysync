import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../../services/bookingService'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BookingModal({ tutor, onClose }) {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  const formatDate = (date) => {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const handleSelectDate = async (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlots([])
    setError('')
    setSlotsLoading(true)
    try {
      const { data } = await bookingService.getAvailability(tutor._id, formatDate(date))
      // Mock slots if backend has none
      const fetchedSlots = data.data.slots || []
      const finalSlots = fetchedSlots.length > 0 ? fetchedSlots : generateMockSlots()
      setSlots(finalSlots)
    } catch (err) {
      console.error(err)
      setSlots(generateMockSlots())
    } finally {
      setSlotsLoading(false)
    }
  }

  const generateMockSlots = () => {
    const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    return times.map((t) => {
      const hour = parseInt(t.split(':')[0])
      return {
        startTime: t,
        endTime: `${String(hour + 1).padStart(2, '0')}:00`,
        isBooked: false,
      }
    })
  }

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select date and time')
      return
    }
    setError('')
    setBooking(true)
    try {
      await bookingService.create({
        tutorId: tutor._id,
        date: formatDate(selectedDate),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        duration: 60,
        notes,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/bookings')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book')
    } finally {
      setBooking(false)
    }
  }

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="w-full max-w-[420px] rounded-3xl p-10 text-center"
          style={{
            background: 'linear-gradient(180deg, #131320, #0f0f18)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.9)',
          }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 20px 48px -8px rgba(16, 185, 129, 0.5)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-100 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-[14px] text-slate-400">
            Redirecting to your bookings...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8 overflow-y-auto"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-3xl relative overflow-hidden my-auto"
        style={{
          background: 'linear-gradient(180deg, #131320, #0f0f18)',
          border: '1px solid rgba(124, 92, 255, 0.2)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div className="h-1"
          style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)' }} />

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[16px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7c5cff, #ec4899)',
                  boxShadow: '0 8px 20px -4px rgba(124, 92, 255, 0.5)',
                }}
              >
                {tutor.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-[18px] font-bold tracking-[-0.02em] text-slate-100">
                  Book with {tutor.user?.name?.split(' ')[0]}
                </h2>
                <p className="text-[12.5px] text-slate-500">
                  ${tutor.hourlyRate}/hour · 60 min session
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-100 hover:bg-white/[0.06] transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Step 1: Date */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'linear-gradient(135deg, #7c5cff, #a855f7)', color: 'white' }}>
                1
              </div>
              <h3 className="text-[14px] font-bold text-slate-100">Select a date</h3>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {dates.map((date, i) => {
                const isSelected = selectedDate && formatDate(selectedDate) === formatDate(date)
                const isToday = i === 0
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDate(date)}
                    className="flex-shrink-0 w-[72px] p-2.5 rounded-xl transition-all"
                    style={
                      isSelected
                        ? {
                            background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                            boxShadow: '0 8px 20px -4px rgba(124, 92, 255, 0.5)',
                          }
                        : {
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }
                    }
                  >
                    <div
                      className="text-[10.5px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#6b6b80' }}
                    >
                      {DAYS[date.getDay()]}
                    </div>
                    <div
                      className="text-[22px] font-extrabold leading-none mb-1"
                      style={{ color: isSelected ? 'white' : '#f5f5f7' }}
                    >
                      {date.getDate()}
                    </div>
                    <div
                      className="text-[10.5px] font-medium"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#6b6b80' }}
                    >
                      {isToday ? 'Today' : MONTHS[date.getMonth()]}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Time */}
          {selectedDate && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #7c5cff, #a855f7)', color: 'white' }}>
                  2
                </div>
                <h3 className="text-[14px] font-bold text-slate-100">Pick a time slot</h3>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-[#7c5cff]/20 border-t-[#7c5cff] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot, i) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime
                    return (
                      <button
                        key={i}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className="py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={
                          isSelected
                            ? {
                                background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                                color: 'white',
                                boxShadow: '0 8px 20px -4px rgba(124, 92, 255, 0.5)',
                              }
                            : slot.isBooked
                            ? {
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: '#3a3a4a',
                                textDecoration: 'line-through',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                              }
                            : {
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: '#a1a1b5',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }
                        }
                      >
                        {slot.startTime}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Notes */}
          {selectedSlot && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #7c5cff, #a855f7)', color: 'white' }}>
                  3
                </div>
                <h3 className="text-[14px] font-bold text-slate-100">Add notes (optional)</h3>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What would you like to focus on?"
                className="input"
                rows={2}
              />
            </div>
          )}

          {/* Summary */}
          {selectedDate && selectedSlot && (
            <div className="rounded-2xl p-4 mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.08), rgba(236, 72, 153, 0.05))',
                border: '1px solid rgba(124, 92, 255, 0.2)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-slate-400">Date & Time</span>
                <span className="text-[13px] font-semibold text-slate-100">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selectedSlot.startTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Total</span>
                <span className="text-[18px] font-extrabold"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  ${tutor.hourlyRate}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[13px] mb-4">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="w-full py-3.5 rounded-xl text-white text-[14px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
              boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
            }}
          >
            {booking ? 'Booking...' : `Confirm Booking · $${tutor.hourlyRate}`}
          </button>
        </div>
      </div>
    </div>
  )
}