// client/src/pages/VideoRoom.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import Peer from "peerjs";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext.jsx";

const PEER_CONFIG = {
  host: import.meta.env.VITE_PEER_HOST || "localhost",
  port: Number(import.meta.env.VITE_PEER_PORT) || 9000,
  path: import.meta.env.VITE_PEER_PATH || "/myapp",
  secure: false,
};

export default function VideoRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callRef = useRef(null);

  const [peerId, setPeerId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef.current]);

  useEffect(() => {
    if (!roomId || !user?._id) return;
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = new Peer(undefined, PEER_CONFIG);
        peerRef.current = peer;

        peer.on("open", (id) => {
          if (!mounted) return;
          setPeerId(id);
          setStatus("waiting");

          socket.emit("video-join", {
            roomId,
            peerId: id,
            userId: user._id,
            name: user.name,
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          if (mounted) {
            setError(err.message || "Video connection failed");
            setStatus("error");
          }
        });

        peer.on("call", (call) => {
          call.answer(localStreamRef.current);
          callRef.current = call;

          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current && mounted) {
              remoteVideoRef.current.srcObject = remoteStream;
              setStatus("connected");
            }
          });
        });
      } catch (err) {
        console.error("Start failed:", err);
        if (mounted) {
          setError(err.message || "Camera/mic access failed");
          setStatus("error");
        }
      }
    };

    start();

    const onPeerReady = ({ peerId: remote, name }) => {
      if (peerRef.current && localStreamRef.current) {
        const call = peerRef.current.call(remote, localStreamRef.current);
        callRef.current = call;

        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current && mounted) {
            remoteVideoRef.current.srcObject = remoteStream;
            setStatus("connected");
          }
        });
      }
    };

    const onPeerLeft = () => {
      setStatus("waiting");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    socket.on("video-peer-ready", onPeerReady);
    socket.on("video-peer-left", onPeerLeft);

    return () => {
      mounted = false;
      try {
        socket.emit("video-leave", { roomId });
        socket.off("video-peer-ready", onPeerReady);
        socket.off("video-peer-left", onPeerLeft);
      } catch {}
      if (callRef.current) { try { callRef.current.close(); } catch {} }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerRef.current) { try { peerRef.current.destroy(); } catch {} }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?._id]);

  const toggleMic = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setMicOn(audio.enabled);
    }
  };

  const toggleCam = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setCamOn(video.enabled);
    }
  };

  const leave = () => {
    try { socket.emit("video-leave", { roomId }); } catch {}
    navigate(-1);
  };

  if (status === "starting") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader />
        </div>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4 p-6">
          <p className="text-red-400">{error || "Video call failed"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple-600 rounded-lg text-sm"
          >
            ← Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">🎥 Video Call</h1>
              <p className="text-xs text-slate-400">Room: {roomId}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleMic}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  micOn ? "bg-slate-700" : "bg-red-600"
                }`}
              >
                {micOn ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>
              <button
                onClick={toggleCam}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  camOn ? "bg-slate-700" : "bg-red-600"
                }`}
              >
                {camOn ? "📷 Cam On" : "📵 Cam Off"}
              </button>
              <button
                onClick={leave}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-700 hover:bg-red-600"
              >
                🚪 Leave
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
                You ({user?.name})
              </span>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {status === "waiting" && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  ⏳ Waiting for other participant...
                </div>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
                {status === "connected" ? "Participant" : "Waiting..."}
              </span>
            </div>
          </div>

          {status === "waiting" && (
            <p className="text-center text-slate-400 text-sm mt-4">
              Share this room with the other person. They'll join automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}