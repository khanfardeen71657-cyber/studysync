import { useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { getSocket } from '../services/socket'

export const useVideoCall = (roomId, user) => {
  const [peers, setPeers] = useState({})
  const [localStream, setLocalStream] = useState(null)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [peerReady, setPeerReady] = useState(false)
  const [mediaError, setMediaError] = useState('')

  const peerRef = useRef(null)
  const localStreamRef = useRef(null)
  const callsRef = useRef([])
  const peersRef = useRef({})
  const userIdRef = useRef(user?._id)

  useEffect(() => {
    peersRef.current = peers
  }, [peers])

  useEffect(() => {
    userIdRef.current = user?._id
  }, [user])

  useEffect(() => {
    if (!roomId || !user?._id) return

    let cancelled = false
    const myPeerId = `studysync-${roomId}-${user._id}`
    const socket = getSocket()

    // ═══════════════════════════════════════
    // 1. GET USER MEDIA
    // ═══════════════════════════════════════
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        localStreamRef.current = stream
        setLocalStream(stream)
        setMediaError('')

        // Start with OFF (user toggles)
        stream.getVideoTracks().forEach((t) => (t.enabled = false))
        stream.getAudioTracks().forEach((t) => (t.enabled = false))

        // ═══════════════════════════════════════
        // 2. CREATE PEER
        // ═══════════════════════════════════════
        const peer = new Peer(myPeerId, { debug: 1 })

        peer.on('open', (id) => {
          console.log('✅ Peer ready:', id)
          setPeerReady(true)
          // Notify backend that peer is ready
          socket.emit('peer-ready', { roomId, peerId: id })
        })

        peer.on('error', (err) => {
          console.error('PeerJS error:', err.type, err.message)
          if (err.type === 'unavailable-id') {
            console.log('⚠️ Peer ID already in use — destroying & recreating')
            peer.destroy()
          }
        })

        // ═══════════════════════════════════════
        // 3. HANDLE INCOMING CALLS (AUTO-ANSWER)
        // ═══════════════════════════════════════
        peer.on('call', (call) => {
          console.log('📞 Incoming call from:', call.peer)
          call.answer(stream)

          call.on('stream', (remoteStream) => {
            console.log('✅ Remote stream from:', call.peer)
            setPeers((prev) => ({
              ...prev,
              [call.peer]: { stream: remoteStream, peerId: call.peer },
            }))
          })

          call.on('close', () => {
            console.log('❌ Call closed:', call.peer)
            setPeers((prev) => {
              const next = { ...prev }
              delete next[call.peer]
              return next
            })
          })

          call.on('error', (err) => {
            console.error('Call error:', err)
          })
        })

        peerRef.current = peer
      } catch (err) {
        console.error('Media error:', err)
        setMediaError('Camera/Microphone permission denied')
      }
    }

    startMedia()

    // ═══════════════════════════════════════
    // 4. SOCKET LISTENERS FOR AUTO-CALL
    // ═══════════════════════════════════════

    // When NEW peer joins → call them
    const handleNewPeer = ({ peerId, userId }) => {
      if (userId === userIdRef.current) return
      console.log('🎯 New peer joined, calling:', peerId)
      setTimeout(() => {
        callPeer(peerId)
      }, 2000)
    }

    // When I join → call existing peers
    const handleExistingPeers = ({ peers: existingPeers }) => {
      console.log('🎯 Existing peers:', existingPeers)
      existingPeers.forEach((p, index) => {
        if (p.userId === userIdRef.current) return
        setTimeout(() => {
          callPeer(p.peerId)
        }, 2000 + index * 800)
      })
    }

    socket.on('new-peer-joined', handleNewPeer)
    socket.on('existing-peers', handleExistingPeers)

    // ═══════════════════════════════════════
    // 5. CLEANUP
    // ═══════════════════════════════════════
    return () => {
      cancelled = true
      socket.off('new-peer-joined', handleNewPeer)
      socket.off('existing-peers', handleExistingPeers)

      callsRef.current.forEach((call) => {
        try {
          call.close()
        } catch {}
      })

      peerRef.current?.destroy()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [roomId, user?._id])

  // ═══════════════════════════════════════
  // CALL A PEER
  // ═══════════════════════════════════════
  const callPeer = (targetPeerId) => {
    if (!peerRef.current || !localStreamRef.current) return
    if (!targetPeerId) return
    if (peersRef.current[targetPeerId]) return

    try {
      console.log('📞 Calling:', targetPeerId)
      const call = peerRef.current.call(targetPeerId, localStreamRef.current)
      callsRef.current.push(call)

      call.on('stream', (remoteStream) => {
        console.log('✅ Got stream from:', targetPeerId)
        setPeers((prev) => ({
          ...prev,
          [targetPeerId]: { stream: remoteStream, peerId: targetPeerId },
        }))
      })

      call.on('close', () => {
        setPeers((prev) => {
          const next = { ...prev }
          delete next[targetPeerId]
          return next
        })
      })

      call.on('error', (err) => {
        console.error('Call error:', err)
      })
    } catch (err) {
      console.error('Failed to call:', err)
    }
  }

  // ═══════════════════════════════════════
  // TOGGLE VIDEO
  // ═══════════════════════════════════════
  const toggleVideo = () => {
    if (!localStreamRef.current) return
    const track = localStreamRef.current.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsVideoOn(track.enabled)
    }
  }

  // ═══════════════════════════════════════
  // TOGGLE AUDIO
  // ═══════════════════════════════════════
  const toggleAudio = () => {
    if (!localStreamRef.current) return
    const track = localStreamRef.current.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsAudioOn(track.enabled)
    }
  }

  return {
    localStream,
    peers,
    isVideoOn,
    isAudioOn,
    peerReady,
    mediaError,
    callPeer,
    toggleVideo,
    toggleAudio,
  }
}