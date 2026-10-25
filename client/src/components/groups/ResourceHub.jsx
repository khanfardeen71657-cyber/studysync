import { useEffect, useState } from 'react'
import { resourceService } from '../../services/resourceService'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import UploadModal from './UploadModal.jsx'

export default function ResourceHub({ groupId, isMember, isAdmin = false }) {
  const { user } = useAuth()
  const toast = useToast()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')

  const loadResources = async () => {
    try {
      const { data } = await resourceService.getGroupResources(groupId)
      setResources(data.data.resources)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [groupId])

  const handleDownload = async (resource) => {
    try {
      await resourceService.trackDownload(resource._id)
      toast.success(`Downloading "${resource.title}"`)
    } catch (err) {
      console.error(err)
    }
    window.open(resource.fileUrl, '_blank')
  }

  const handleDelete = async (resource) => {
    if (!confirm('Delete this resource?')) return
    try {
      await resourceService.delete(resource._id)
      setResources((prev) => prev.filter((r) => r._id !== resource._id))
      toast.success('Resource deleted')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📕'
    if (type?.includes('word')) return '📘'
    return '📄'
  }

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = resources.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-slate-100 mb-1 flex items-center gap-2">
            <span className="text-[18px]">📁</span>
            Shared Resources
            <span className="text-[12px] text-slate-500 font-medium">
              ({resources.length})
            </span>
          </h3>
          <p className="text-[12.5px] text-slate-500">
            Files and notes shared with the group
          </p>
        </div>

        {isMember && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-[12.5px] font-semibold transition hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
              boxShadow: '0 4px 16px rgba(124, 92, 255, 0.4)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </button>
        )}
      </div>

      {resources.length > 0 && (
        <div className="relative mb-4">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px] outline-none text-slate-100 placeholder:text-slate-500"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#7c5cff]/20 border-t-[#7c5cff] animate-spin mx-auto" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[28px] animate-float"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(236, 72, 153, 0.1))',
              border: '1px solid rgba(124, 92, 255, 0.2)',
            }}
          >
            📁
          </div>
          <h4 className="text-[15px] font-bold text-slate-100 mb-1">
            No resources yet
          </h4>
          <p className="text-[13px] text-slate-500 mb-5">
            Upload notes, PDFs, or images to share with your group
          </p>
          {isMember && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
              }}
            >
              Upload first resource
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-[13px]">
          No files match "{search}"
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOwner = r.uploadedBy?._id === user?._id
            const canDelete = isOwner || isAdmin

            return (
              <div
                key={r._id}
                className="group flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 92, 255, 0.05)'
                  e.currentTarget.style.border = '1px solid rgba(124, 92, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
                  style={{
                    background: 'rgba(124, 92, 255, 0.1)',
                    border: '1px solid rgba(124, 92, 255, 0.15)',
                  }}
                >
                  {getFileIcon(r.fileType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-slate-100 truncate mb-0.5 flex items-center gap-2">
                    {r.title}
                    {!canDelete && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b6b80"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="flex-shrink-0"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] text-slate-500 flex-wrap">
                    <span>{formatSize(r.fileSize)}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>by {r.uploadedBy?.name || 'Unknown'}</span>
                    {r.downloads > 0 && (
                      <>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>{r.downloads} downloads</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(r)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#a78bfa] hover:bg-[rgba(124,92,255,0.15)] transition"
                    title="Download"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal
          groupId={groupId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            loadResources()
          }}
        />
      )}
    </div>
  )
}