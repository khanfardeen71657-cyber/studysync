// src/components/session/VideoCall.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "peerjs";
import { socket } from "../../socket";
import { useAuth } from "../../context/AuthContext";

const PEER_CONFIG = {
  host: import.meta.env.VITE_PEER_HOST || "localhost",
  port: Number(import.meta.env.VITE_PEER_PORT) || 9000,
  path: import.meta.env.VITE_PEER_PATH || "/myapp",
  secure: false,
};

export default function VideoCall({ groupId }) {
  const { user } = useAuth();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({}); // userId -> video element
  const callsRef = useRef({});        // userId -> MediaConnection

  const [peerId, setPeerId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]); // [{userId, name, stream}]
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  // ─────────────────────────────────────────────────────
  // Attach local stream to video element
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ─────────────────────────────────────────────────────
  // Attach remote streams to video elements
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    remotePeers.forEach(({ userId, stream }) => {
      const el = remoteVideoRefs.current[userId];
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    });
  }, [remotePeers]);

  // ─────────────────────────────────────────────────────
  // Cleanup helper
  // ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    // close all calls
    Object.values(callsRef.current).forEach((call) => {
      try { call.close(); } catch {}
    });
    callsRef.current = {};

    // stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    // destroy peer
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch {}
      peerRef.current = null;
    }

    setRemotePeers([]);
    setPeerId(null);
    setLocalStream(null);
    setStarting(false);
  }, []);

  // ─────────────────────────────────────────────────────
  // Main effect: getUserMedia + Peer + socket events
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setStarting(true);
        setError("");

        // 1. Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Create Peer
        const peer = new Peer(undefined, PEER_CONFIG);
        peerRef.current = peer;

        peer.on("open", (id) => {
          if (!mounted) return;
          setPeerId(id);
          setStarting(false);

          // 3. Tell socket we're ready
          socket.emit("peer-ready", {
            groupId,
            peerId: id,
            name: user?.name || "User",
          });
        });

        peer.on("error", (err) => {
          console.error("PeerJS error:", err);
          if (mounted) setError(err.message || "PeerJS error");
        });

        peer.on("call", (call) => {
          // Incoming call — answer with local stream
          call.answer(localStreamRef.current);
          handleIncomingCall(call);
        });

        // 4. Request existing peers list
        socket.emit("join-group", { groupId }, () => {});

      } catch (err) {
        console.error("Video start failed:", err);
        if (mounted) {
          setError(err.message || "Could not start video");
          setStarting(false);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      try {
        socket.emit("peer-left", { groupId });
      } catch {}
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // ─────────────────────────────────────────────────────
  // Handle incoming call
  // ─────────────────────────────────────────────────────
  const handleIncomingCall = (call) => {
    const remoteUserId = call.peer; // peerId of caller
    callsRef.current[remoteUserId] = call;

    call.on("stream", (remoteStream) => {
      setRemotePeers((prev) => {
        const exists = prev.find((p) => p.userId === remoteUserId);
        if (exists) {
          return prev.map((p) =>
            p.userId === remoteUserId ? { ...p, stream: remoteStream } : p
          );
        }
        return [
          ...prev,
          { userId: remoteUserId, name: "Peer", stream: remoteStream },
        ];
      });
    });

    call.on("close", () => {
      delete callsRef.current[remoteUserId];
      setRemotePeers((prev) => prev.filter((p) => p.userId !== remoteUserId));
    });

    call.on("error", (err) => {
      console.warn("Call error:", err);
    });
  };

  // ─────────────────────────────────────────────────────
  // Outgoing call to a peer
  // ─────────────────────────────────────────────────────
  const callPeer = useCallback((remotePeerId, remoteName) => {
    if (!peerRef.current || !localStreamRef.current) return;
    if (callsRef.current[remotePeerId]) return; // already calling

    try {
      const call = peerRef.current.call(remotePeerId, localStreamRef.current);
      callsRef.current[remotePeerId] = call;

      call.on("stream", (remoteStream) => {
        setRemotePeers((prev) => {
          const exists = prev.find((p) => p.userId === remotePeerId);
          if (exists) {
            return prev.map((p) =>
              p.userId === remotePeerId
                ? { ...p, stream: remoteStream, name: remoteName || p.name }
                : p
            );
          }
          return [
            ...prev,
            {
              userId: remotePeerId,
              name: remoteName || "Peer",
              stream: remoteStream,
            },
          ];
        });
      });

      call.on("close", () => {
        delete callsRef.current[remotePeerId];
        setRemotePeers((prev) =>
          prev.filter((p) => p.userId !== remotePeerId)
        );
      });
    } catch (err) {
      console.warn("callPeer failed:", err);
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // Socket listeners — peer-ready, peers-list, peer-left
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!peerId) return;

    const onPeerReady = ({ peerId: remotePeerId, name }) => {
      if (remotePeerId === peerId) return;
      callPeer(remotePeerId, name);
    };

    const onPeersList = ({ peers }) => {
      (peers || []).forEach(({ peerId: remotePeerId, name }) => {
        if (remotePeerId === peerId) return;
        callPeer(remotePeerId, name);
      });
    };

    const onPeerLeft = ({ userId }) => {
      // userId is DB userId; we key by peerId. Try both.
      setRemotePeers((prev) => {
        const remaining = prev.filter(
          (p) => p.userId !== userId && p.userId !== peerId
        );
        remaining.forEach((p) => {
          const call = callsRef.current[p.userId];
          if (call) {
            try { call.close(); } catch {}
            delete callsRef.current[p.userId];
          }
        });
        return remaining;
      });
    };

    socket.on("peer-ready", onPeerReady);
    socket.on("peers-list", onPeersList);
    socket.on("peer-left", onPeerLeft);

    return () => {
      socket.off("peer-ready", onPeerReady);
      socket.off("peers-list", onPeersList);
      socket.off("peer-left", onPeerLeft);
    };
  }, [peerId, callPeer]);

  // ─────────────────────────────────────────────────────
  // Controls
  // ─────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audio = localStreamRef.current.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setMicOn(audio.enabled);
    }
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const video = localStreamRef.current.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setCamOn(video.enabled);
    }
  };

  const leaveCall = () => {
    try { socket.emit("peer-left", { groupId }); } catch {}
    cleanup();
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">
        ❌ Video error: {error}
      </div>
    );
  }

  if (starting) {
    return (
      <div className="p-6 bg-slate-900 rounded-xl text-center text-slate-400">
        🎥 Starting camera...
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-emerald-400">
            🎥 Video Call
          </span>
          <span className="text-xs text-slate-500">
            ({remotePeers.length + 1} in room)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleMic}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              micOn
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {micOn ? "🎤 Mic On" : "🔇 Mic Off"}
          </button>
          <button
            onClick={toggleCam}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              camOn
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {camOn ? "📷 Cam On" : "📵 Cam Off"}
          </button>
          <button
            onClick={leaveCall}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600"
          >
            🚪 Leave
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Local */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 rounded text-xs">
            You {!camOn && "(cam off)"}
          </span>
        </div>

        {/* Remote */}
        {remotePeers.map((p) => (
          <div
            key={p.userId}
            className="relative bg-black rounded-lg overflow-hidden aspect-video"
          >
            <video
              ref={(el) => (remoteVideoRefs.current[p.userId] = el)}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 rounded text-xs">
              {p.name || "Peer"}
            </span>
          </div>
        ))}

        {remotePeers.length === 0 && (
          <div className="flex items-center justify-center bg-slate-800 rounded-lg aspect-video text-slate-500 text-sm">
            Waiting for others to join...
          </div>
        )}
      </div>
    </div>
  );
}