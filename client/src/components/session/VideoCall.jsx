// src/components/session/VideoCall.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "peerjs";
import { socket } from "../../socket";

const PEER_CONFIG = {
  host: "localhost",
  port: 9000,
  path: "/myapp",
  secure: false,
  debug: 2,
};

export default function VideoCall({ groupId, user }) {
  const [peerId, setPeerId] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [error, setError] = useState(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const callsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());

  // 1. Local media
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("getUserMedia failed:", err);
        setError("Camera/microphone permission required");
      }
    })();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 2. PeerJS init
  useEffect(() => {
    if (!user?._id) return;

    const peer = new Peer(user._id, PEER_CONFIG);
    peerRef.current = peer;

    peer.on("open", (id) => {
      console.log("✅ PeerJS open with id:", id);
      setPeerId(id);
      setError(null);
      socket.emit("peer-ready", { groupId, peerId: id, name: user.name });
    });

    peer.on("call", (call) => {
      console.log("📞 Incoming call from:", call.peer);
      const stream = localStreamRef.current;
      if (!stream) {
        call.close();
        return;
      }
      call.answer(stream);
      callsRef.current.set(call.peer, call);

      call.on("stream", (remoteStream) => {
        remoteStreamsRef.current.set(call.peer, remoteStream);
        setRemotePeers((prev) => {
          const existing = prev.find((p) => p.peerId === call.peer);
          if (existing) {
            return prev.map((p) =>
              p.peerId === call.peer ? { ...p, stream: remoteStream } : p
            );
          }
          return [
            ...prev,
            { peerId: call.peer, name: "Peer", stream: remoteStream },
          ];
        });
      });

      call.on("close", () => {
        callsRef.current.delete(call.peer);
        remoteStreamsRef.current.delete(call.peer);
        setRemotePeers((prev) => prev.filter((p) => p.peerId !== call.peer));
      });
      call.on("error", (err) => console.warn("Call error:", err));
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      setError(err.message || "PeerJS error");
    });

    peer.on("disconnected", () => {
      console.warn("⚠️ PeerJS disconnected — reconnecting...");
      setTimeout(() => {
        try { peer.reconnect(); } catch (e) { console.warn(e.message); }
      }, 1500);
    });

    peer.on("close", () => {
      setPeerId(null);
    });

    return () => {
      callsRef.current.forEach((c) => { try { c.close(); } catch {} });
      callsRef.current.clear();
      remoteStreamsRef.current.clear();
      if (!peer.destroyed) peer.destroy();
      peerRef.current = null;
      socket.emit("peer-left", { groupId });
    };
  }, [user?._id, groupId]);

  // 3. Call a peer
  const callPeer = useCallback((targetPeerId) => {
    const peer = peerRef.current;
    const stream = localStreamRef.current;
    if (!peer || !stream || !targetPeerId) return;
    if (targetPeerId === peer.id) return;
    if (callsRef.current.has(targetPeerId)) return;

    const call = peer.call(targetPeerId, stream);
    if (!call) return;
    callsRef.current.set(targetPeerId, call);

    call.on("stream", (remoteStream) => {
      remoteStreamsRef.current.set(targetPeerId, remoteStream);
      setRemotePeers((prev) => {
        const existing = prev.find((p) => p.peerId === targetPeerId);
        if (existing) {
          return prev.map((p) =>
            p.peerId === targetPeerId ? { ...p, stream: remoteStream } : p
          );
        }
        return [
          ...prev,
          { peerId: targetPeerId, name: "Peer", stream: remoteStream },
        ];
      });
    });

    call.on("close", () => {
      callsRef.current.delete(targetPeerId);
      remoteStreamsRef.current.delete(targetPeerId);
      setRemotePeers((prev) => prev.filter((p) => p.peerId !== targetPeerId));
    });
    call.on("error", (err) => console.warn("Call error:", err));
  }, []);

  // 4. peer-ready / peer-left from socket
  useEffect(() => {
    const onPeerReady = ({ peerId: newPeerId, name }) => {
      if (newPeerId === peerRef.current?.id) return;
      console.log("📣 peer-ready:", name, newPeerId);
      setRemotePeers((prev) => {
        const found = prev.find((p) => p.peerId === newPeerId);
        if (found)
          return prev.map((p) =>
            p.peerId === newPeerId ? { ...p, name } : p
          );
        return [...prev, { peerId: newPeerId, name, stream: null }];
      });
      callPeer(newPeerId);
    };

    const onPeerLeft = ({ peerId: goneId }) => {
      const call = callsRef.current.get(goneId);
      if (call) {
        try { call.close(); } catch {}
        callsRef.current.delete(goneId);
      }
      remoteStreamsRef.current.delete(goneId);
      setRemotePeers((prev) => prev.filter((p) => p.peerId !== goneId));
    };

    const onPeersList = ({ peers }) => {
      peers.forEach((p) => {
        if (p.peerId === peerRef.current?.id) return;
        callPeer(p.peerId);
      });
    };

    socket.on("peer-ready", onPeerReady);
    socket.on("peer-left", onPeerLeft);
    socket.on("peers-list", onPeersList);

    return () => {
      socket.off("peer-ready", onPeerReady);
      socket.off("peer-left", onPeerLeft);
      socket.off("peers-list", onPeersList);
    };
  }, [callPeer]);

  // 5. Controls
  const toggleMute = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setIsMuted(!audio.enabled);
    }
  };
  const toggleCam = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setIsCamOff(!video.enabled);
    }
  };
  const leaveCall = () => {
    callsRef.current.forEach((c) => { try { c.close(); } catch {} });
    callsRef.current.clear();
    if (peerRef.current && !peerRef.current.destroyed) {
      peerRef.current.destroy();
    }
    setRemotePeers([]);
  };

  // 6. Render
  return (
    <div className="p-4 bg-slate-900 rounded-xl text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">🎥 Video Call</h3>
        <span className="text-xs text-slate-400">
          {peerId ? `Your ID: ${peerId.slice(0, 8)}...` : "Connecting..."}
        </span>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 left-2 text-xs bg-black/60 px-2 py-0.5 rounded">
            You {isMuted && "(muted)"} {isCamOff && "(cam off)"}
          </span>
        </div>

        {remotePeers.map((p) => (
          <RemoteVideo key={p.peerId} peer={p} />
        ))}
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={toggleMute}
          className={`px-3 py-2 rounded-lg text-sm ${
            isMuted ? "bg-red-600" : "bg-slate-700"
          }`}
        >
          {isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </button>
        <button
          onClick={toggleCam}
          className={`px-3 py-2 rounded-lg text-sm ${
            isCamOff ? "bg-red-600" : "bg-slate-700"
          }`}
        >
          {isCamOff ? "📷 Cam On" : "📷 Cam Off"}
        </button>
        <button
          onClick={leaveCall}
          className="px-3 py-2 rounded-lg text-sm bg-red-700 hover:bg-red-600"
        >
          ❌ Leave
        </button>
      </div>
    </div>
  );
}

function RemoteVideo({ peer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && peer.stream) {
      ref.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {peer.stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
          Connecting to {peer.name || peer.peerId.slice(0, 6)}...
        </div>
      )}
      <span className="absolute bottom-1 left-2 text-xs bg-black/60 px-2 py-0.5 rounded">
        {peer.name || peer.peerId.slice(0, 6)}
      </span>
    </div>
  );
}