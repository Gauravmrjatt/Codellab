"use client"

import React, { useEffect, useState, useRef } from "react"
import SimplePeer from "simple-peer"
import type { SignalData } from "simple-peer"
import { useWS } from "@/context/WebSocketProvider"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface VideoCallProps {
  onLeave: () => void
}

interface PeerData {
  peerId: string
  stream?: MediaStream
}

interface PeerInstance {
    peerId: string;
    peer: SimplePeer.Instance;
}

export function VideoCall({ onLeave }: VideoCallProps) {
  const { socket, roomId, userId, participants } = useWS()
  const [peers, setPeers] = useState<Record<string, PeerData>>({}) 
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const userVideo = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<PeerInstance[]>([])

  // Initialize local stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        stream = s;
        setLocalStream(s)
        if (userVideo.current) {
          userVideo.current.srcObject = s
        }
        
        if (socket) {
            socket.emit("call:join", { roomId })
        }
      })
      .catch(err => {
        console.error("Failed to get local stream", err)
        setError("Could not access camera/microphone")
      })
      
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      peersRef.current.forEach(p => p.peer.destroy());
      peersRef.current = [];
    }
  }, [roomId, socket])

  // Handle socket events
  useEffect(() => {
    if (!socket || !localStream) return

    const createPeer = (userToSignal: string, stream: MediaStream) => {
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      })

      peer.on("signal", (signal: SignalData) => {
        socket.emit("call:signal", {
          roomId,
          targetUserId: userToSignal,
          signal
        })
      })

      peer.on("stream", (remoteStream: MediaStream) => {
          setPeers(prev => {
              const newPeers = {...prev};
              newPeers[userToSignal] = { ...(prev[userToSignal] || { peerId: userToSignal }), stream: remoteStream };
              return newPeers;
          });
      })

      return peer
    }

    const addPeer = (incomingSignal: SignalData, callerId: string, stream: MediaStream) => {
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
      })

      peer.on("signal", (signal: SignalData) => {
        socket.emit("call:signal", {
          roomId,
          targetUserId: callerId,
          signal
        })
      })

      peer.on("stream", (remoteStream: MediaStream) => {
          setPeers(prev => {
              const newPeers = {...prev};
              newPeers[callerId] = { ...(prev[callerId] || { peerId: callerId }), stream: remoteStream };
              return newPeers;
          });
      })

      peer.signal(incomingSignal)
      return peer
    }

    const handleUserConnected = (data: { userId: string }) => {
      if (data.userId === userId) return

      const existingPeerIndex = peersRef.current.findIndex(p => p.peerId === data.userId);
      if (existingPeerIndex !== -1) {
          peersRef.current[existingPeerIndex].peer.destroy();
          peersRef.current.splice(existingPeerIndex, 1);
      }

      const peer = createPeer(data.userId, localStream)
      peersRef.current.push({ peerId: data.userId, peer })
      setPeers(prev => {
          const newPeers = {...prev};
          newPeers[data.userId] = { peerId: data.userId };
          return newPeers;
      });
    }

    const handleSignal = (data: { userId: string, signal: SignalData }) => {
      const item = peersRef.current.find(p => p.peerId === data.userId)

      if (item) {
        item.peer.signal(data.signal)
      } else {
        if (peersRef.current.find(p => p.peerId === data.userId)) return;

        const peer = addPeer(data.signal, data.userId, localStream)
        peersRef.current.push({ peerId: data.userId, peer })
        setPeers(prev => {
            const newPeers = {...prev};
            newPeers[data.userId] = { peerId: data.userId };
            return newPeers;
        });
      }
    }

    const handleUserDisconnected = (data: { userId: string }) => {
      const peerIndex = peersRef.current.findIndex(p => p.peerId === data.userId);
      if (peerIndex !== -1) {
        peersRef.current[peerIndex].peer.destroy();
        peersRef.current.splice(peerIndex, 1);
      }
      setPeers(prev => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
      });
    }

    socket.on("call:user-connected", handleUserConnected)
    socket.on("call:signal", handleSignal)
    socket.on("call:user-disconnected", handleUserDisconnected)

    return () => {
      socket.off("call:user-connected", handleUserConnected)
      socket.off("call:signal", handleSignal)
      socket.off("call:user-disconnected", handleUserDisconnected)
    }
  }, [socket, localStream, roomId, userId])

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => { track.enabled = !track.enabled })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => { track.enabled = !track.enabled })
      setIsVideoOff(!isVideoOff)
    }
  }

  const endCall = () => {
    peersRef.current.forEach(p => p.peer.destroy())
    peersRef.current = []
    setPeers({}) 
    socket?.emit("call:leave", { roomId })
    onLeave()
  }

  const activePeers = Object.values(peers);
  const gridCols = activePeers.length === 0 ? 1 : activePeers.length + 1 <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Video Grid */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div 
          className="grid gap-2 h-full content-center"
          style={{ 
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            gridAutoRows: 'minmax(0, 1fr)'
          }}
        >
          {/* Self View */}
          <div className="relative bg-card rounded-lg overflow-hidden border border-border group">
            {localStream && !isVideoOff ? (
              <video
                ref={userVideo}
                muted
                autoPlay
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center mb-2 border border-border">
                   <User className="h-8 w-8 opacity-50" />
                </div>
                <span className="text-xs">Camera Off</span>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
               <div className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-2 py-1 rounded-md border border-border">
                 You {isMuted && "(Muted)"}
               </div>
            </div>
            
            {error && (
               <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4 text-center">
                 <p className="text-destructive text-xs">{error}</p>
               </div>
            )}
          </div>

          {/* Remote Peers */}
          {activePeers.map((peer) => {
             const participant = participants.find(p => p.id === peer.peerId);
             return (
                <VideoPlayer
                    key={peer.peerId}
                    peer={peer}
                    username={participant?.username || `User ${peer.peerId.slice(0,4)}`}
                />
             );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 flex items-center justify-center gap-3 bg-card/90 backdrop-blur-md border-t border-border z-10">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full h-10 w-10 transition-all border-border",
            isMuted ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" : "hover:bg-muted"
          )}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full h-10 w-10 transition-all border-border",
            isVideoOff ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" : "hover:bg-muted"
          )}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-10 w-10 shadow-sm"
          onClick={endCall}
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function VideoPlayer({ peer, username }: { peer: PeerData; username?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (peer.stream && ref.current) {
        ref.current.srcObject = peer.stream
    }
  }, [peer.stream])

  return (
    <div className="relative bg-card rounded-lg overflow-hidden border border-border">
      {peer.stream ? (
        <video
            ref={ref}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
        />
      ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
              <Loader2 className="h-8 w-8 animate-spin mb-2 opacity-50" />
              <span className="text-xs">Connecting...</span>
          </div>
      )}
      <div className="absolute bottom-2 left-2">
        <div className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-2 py-1 rounded-md border border-border flex items-center gap-1.5">
           <Avatar className="h-3 w-3">
             <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
               {username?.[0]?.toUpperCase() || "U"}
             </AvatarFallback>
           </Avatar>
           {username}
        </div>
      </div>
    </div>
  )
}