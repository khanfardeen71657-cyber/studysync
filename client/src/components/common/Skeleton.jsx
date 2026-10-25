export default function Skeleton({ className = '', width, height, rounded = '8px' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: rounded,
      }}
    />
  )
}

export function GroupCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-start gap-3.5 mb-4">
        <Skeleton width="48px" height="48px" rounded="12px" />
        <div className="flex-1">
          <Skeleton width="60%" height="16px" rounded="6px" className="mb-2" />
          <Skeleton width="40%" height="12px" rounded="4px" />
        </div>
      </div>
      <Skeleton width="100%" height="12px" rounded="4px" className="mb-2" />
      <Skeleton width="70%" height="12px" rounded="4px" className="mb-5" />
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <Skeleton width="80px" height="12px" rounded="4px" />
        <Skeleton width="60px" height="12px" rounded="4px" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <Skeleton width="60%" height="12px" rounded="4px" className="mb-3" />
      <Skeleton width="40%" height="32px" rounded="6px" />
    </div>
  )
}

export function QuizCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-start gap-3.5 mb-4">
        <Skeleton width="48px" height="48px" rounded="12px" />
        <div className="flex-1">
          <Skeleton width="70%" height="16px" rounded="6px" className="mb-2" />
          <Skeleton width="50%" height="12px" rounded="4px" />
        </div>
      </div>
      <Skeleton width="100%" height="12px" rounded="4px" className="mb-4" />
      <Skeleton width="100%" height="36px" rounded="10px" />
    </div>
  )
}