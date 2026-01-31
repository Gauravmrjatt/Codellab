"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Code, Users, Video, Phone, Minimize2, Maximize2, Mic, Play, Pause, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWS } from "@/context/WebSocketProvider"
import { VideoCall } from "./video-call"
import { ResizableBox } from "react-resizable"
import Draggable from "react-draggable"
import "react-resizable/css/styles.css"
import { motion, AnimatePresence } from "framer-motion"
import { FaVideo } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
interface Message {
  id: string
  userId: string
  username: string
  content: string
  timestamp: string | Date
  type?: 'text' | 'code' | 'audio'
  mentionedUsers?: string[]
}

interface ChatPanelProps {
  className?: string
}

export function ChatPanel({
  className,
}: ChatPanelProps) {
  const {
    userId,
    username,
    messages,
    sendMessage,
    isConnected,
    participants,
    typingUsers: remoteTypingUsers,
    sendTyping,
    deleteMessage
  } = useWS()

  const [newMessage, setNewMessage] = useState("")
  const [showCodeBlock, setShowCodeBlock] = useState(false)
  const [codeContent, setCodeContent] = useState("")
  const [codeLanguage, setCodeLanguage] = useState("javascript")
  const [isSelfTyping, setIsSelfTyping] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [isVideoCallMinimized, setIsVideoCallMinimized] = useState(false)
  const [videoCallSize, setVideoCallSize] = useState({ width: 400, height: 300 })
  const [mentionQuery, setMentionQuery] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Refs for input and mentions
  const inputRef = useRef<HTMLInputElement>(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null)
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nodeRef = useRef(null) // For Draggable to avoid strict mode warnings

  // Group messages logic
  const groupedMessages = useMemo(() => {
    const groups: Message[][] = []
    let currentGroup: Message[] = []

    messages.forEach((msg: any, index: number) => {
      const prevMsg = messages[index - 1]
      const isSameUser = prevMsg && prevMsg.userId === msg.userId
      const isWithinTimeWindow = prevMsg && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000) // 1 minute window

      if (isSameUser && isWithinTimeWindow) {
        currentGroup.push(msg)
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [msg]
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }, [messages])

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const sendAudioMessage = async () => {
    if (!recordedAudio) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64Audio = reader.result as string
      sendMessage(base64Audio, 'audio')
      setRecordedAudio(null)
    }
    reader.readAsDataURL(recordedAudio)
  }

  const formatTimeSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const playAudio = (audioSrc: string, messageId: string) => {
    if (audioPlaying === messageId) {
      setAudioPlaying(null)
    } else {
      setAudioPlaying(messageId)
      const audio = new Audio(audioSrc)
      audio.play()
      audio.onended = () => setAudioPlaying(null)
      audio.onerror = () => setAudioPlaying(null)
    }
  }

  useEffect(() => {
    // Initialize notification sound
    const sound = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAAAAA="); // Simple beep sound
    setNotificationSound(sound);

    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, remoteTypingUsers, showCodeBlock, recordedAudio])

  // Play notification sound when a new message arrives (but not for own messages)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only play sound for messages not sent by the current user
      if (lastMessage.userId !== userId && notificationSound) {
        try {
          notificationSound.currentTime = 0;
          notificationSound.play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {
          console.log("Audio play failed:", e);
        }
      }
    }
  }, [messages, userId, notificationSound])

  // Function to extract mentions from the message content
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@([^\s]+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];

    // Extract just the usernames without the @ symbol
    return matches.map(match => match.substring(1));
  };

  // Function to render message content with highlighted mentions
  const renderFormattedMessage = (content: string, mentionedUsers: string[]) => {
    if (!mentionedUsers || mentionedUsers.length === 0) {
      return <span>{content}</span>;
    }

    // Split the content by mentions
    const parts = content.split(/(@[^\s]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1); // Remove the '@'
        const isMentioned = mentionedUsers.includes(username);

        return (
          <span
            key={index}
            className={cn(
              "font-medium",
              isMentioned ? "text-blue-500 bg-blue-100/30 px-1 rounded" : "text-foreground"
            )}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Filter participants based on mention query
  const filteredParticipants = useMemo(() => {
    if (!mentionQuery) return participants;
    return participants.filter(participant =>
      participant.username.toLowerCase().includes(mentionQuery.toLowerCase()) &&
      participant.username !== username // Exclude current user
    );
  }, [mentionQuery, participants, username]);

  // Handle input focus
  const handleInputFocus = () => {
    const text = newMessage;
    const caretPos = inputRef.current?.selectionStart || text.length;
    const textBeforeCaret = text.substring(0, caretPos);

    // Check if the character before caret is '@' or part of a mention
    const atIndex = textBeforeCaret.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === textBeforeCaret.length - 1) {
      // Just typed '@'
      setMentionQuery('');
      setShowMentions(true);
    } else if (atIndex !== -1 && textBeforeCaret.substring(atIndex).match(/^@\w*$/)) {
      // Part of a mention
      const mentionText = textBeforeCaret.substring(atIndex + 1);
      setMentionQuery(mentionText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding mentions to allow click on dropdown items
    setTimeout(() => setShowMentions(false), 200);
  };

  // Handle key down for mentions navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredParticipants.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredParticipants[mentionIndex]) {
          handleMentionSelect(filteredParticipants[mentionIndex].username);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  // Handle mention selection
  const handleMentionSelect = (selectedUsername: string) => {
    const text = newMessage;
    const caretPos = inputRef.current?.selectionStart || text.length;
    const textBeforeCaret = text.substring(0, caretPos);
    const textAfterCaret = text.substring(caretPos);

    // Find the last '@' before caret
    const atIndex = textBeforeCaret.lastIndexOf('@');
    if (atIndex !== -1) {
      // Replace the mention text with selected username
      const newText = textBeforeCaret.substring(0, atIndex) + `@${selectedUsername} ` + textAfterCaret;
      setNewMessage(newText);

      // Move cursor after the inserted mention
      setTimeout(() => {
        if (inputRef.current) {
          const newCaretPos = textBeforeCaret.length - (caretPos - atIndex) + selectedUsername.length + 2;
          inputRef.current.setSelectionRange(newCaretPos, newCaretPos);
        }
      }, 0);
    }

    setShowMentions(false);
    setMentionQuery('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !showCodeBlock && !recordedAudio) return

    if (showCodeBlock) {
      const codeMessage = `
\`\`\`${codeLanguage}
${codeContent}
\`\`\`
`;

      sendMessage(codeMessage, "code")
      setShowCodeBlock(false)
      setCodeContent("")
      setCodeLanguage("javascript")
    } else if (recordedAudio) {
      sendAudioMessage()
    } else {
      // Extract mentions from the message
      const mentionedUsers = extractMentions(newMessage);

      // Send the message with mention information
      sendMessage(newMessage, "text", mentionedUsers)
      setNewMessage("")
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ?? ""
    setNewMessage(value)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    const shouldBeTyping = value.trim().length > 0
    if (shouldBeTyping && !isSelfTyping) {
      setIsSelfTyping(true)
      sendTyping(true)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isSelfTyping) {
        setIsSelfTyping(false)
        sendTyping(false)
      }
    }, 2200)
  }

  const formatTime = (date: any) => {
    if (!date || isNaN(new Date(date).getTime())) return ""
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const extractCodeFromMessage = (content: string) => {
    const codeMatch = content.match(/```(\w*)\n([\s\S]*?)\n```/)
    if (codeMatch) {
      return { language: codeMatch[1] || "text", code: codeMatch[2].trim() }
    }
    return null
  }

  const displayTypingUsers = remoteTypingUsers.filter(
    u => username && u.toLowerCase() !== username.toLowerCase() && u.toLowerCase() !== "you"
  )

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes wave {
        0% { transform: scaleY(0.5); }
        50% { transform: scaleY(1.2); }
        100% { transform: scaleY(0.5); }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  return (
    <div className={cn("flex flex-col h-full relative overflow-hidden bg-transparent backdrop-blur-sm  border-0", className)}>

      {/* Header */}
      <div className="shrink-0 p-3 border-b border-border flex items-center justify-between z-10 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn("w-2.5 h-2.5 rounded-full transition-colors", isConnected ? "bg-green-500" : "bg-destructive")} />
            {isConnected && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />}
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Team Chat</span>
        </div>
        <div className="flex items-center gap-1">
          {showVideoCall && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground rounded-full w-8 h-8"
                onClick={() => setIsVideoCallMinimized(!isVideoCallMinimized)}
              >
                {isVideoCallMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive/10 text-destructive rounded-full w-8 h-8"
                onClick={() => setShowVideoCall(false)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </>
          )}
          {!showVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground rounded-full w-8 h-8"
              onClick={() => { setShowVideoCall(true); setIsVideoCallMinimized(false); }}
            >
              <FaVideo className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("hover:bg-accent hover:text-accent-foreground rounded-full w-8 h-8", showParticipants && "bg-accent text-accent-foreground")}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Participants Popover */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-14 right-4 z-30 w-64 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-muted/20">
              <h4 className="font-semibold text-sm text-foreground">Participants</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {participants.filter(p => p.isOnline).length} online
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-border">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50 rounded-lg transition-colors group">
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {p.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {p.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground">{p.username}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Video Call */}
      {showVideoCall && (
        <Draggable
          nodeRef={nodeRef}
          handle=".drag-handle"
          bounds="parent"
          defaultPosition={{ x: 20, y: 60 }}
          disabled={isVideoCallMinimized}
        >
          <div
            ref={nodeRef}
            className={cn(
              "absolute z-40 bg-card border border-border rounded-xl shadow-2xl overflow-hidden transition-all duration-200",
              isVideoCallMinimized ? "w-64 h-12 !top-auto !left-auto bottom-20 right-4" : ""
            )}
            style={!isVideoCallMinimized ? { width: videoCallSize.width, height: videoCallSize.height } : {}}
          >
            {/* Drag Handle Overlay */}
            {!isVideoCallMinimized && (
              <div className="absolute top-0 left-0 right-0 h-8 z-50 flex items-center justify-center group cursor-move drag-handle opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-b from-black/50 to-transparent">
                <div className="w-12 h-1 bg-white/50 rounded-full" />
              </div>
            )}

            {!isVideoCallMinimized ? (
              <ResizableBox
                width={videoCallSize.width}
                height={videoCallSize.height}
                minConstraints={[300, 220]}
                maxConstraints={[800, 600]}
                onResizeStop={(e, { size }) => setVideoCallSize(size)}
                resizeHandles={['se']}
                className="h-full w-full relative"
              >
                <VideoCall onLeave={() => setShowVideoCall(false)} />
                {/* Visual Resize Handle */}
                <div className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize z-50 opacity-50 hover:opacity-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white w-full h-full">
                    <path d="M21 15L21 21L15 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </ResizableBox>
            ) : (
              <div
                className="w-full h-full flex items-center justify-between px-4 cursor-pointer hover:bg-muted/50 bg-card border-l-4 border-green-500"
                onClick={() => setIsVideoCallMinimized(false)}
              >
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Call Active</span>
                </div>
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </Draggable>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="space-y-6">
          {groupedMessages.map((group: Message[], groupIndex: number) => {
            const isOwn = group[0].userId === userId
            return (
              <div key={groupIndex} className={cn("flex gap-3 max-w-[85%]", isOwn ? "ml-auto justify-end" : "")}>
                {!isOwn && (
                  <Avatar className="h-8 w-8 mt-1 shrink-0 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                      {group[0].username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                  {!isOwn && (
                    <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">{group[0].username}</span>
                  )}

                  {group.map((msg: Message, i: number) => {
                    const codeBlock = extractCodeFromMessage(msg.content)
                    const isLastInGroup = i === group.length - 1
                    const isFirstInGroup = i === 0

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "relative px-4 py-2 text-sm shadow-sm max-w-full group/message transition-all",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-l-2xl rounded-r-md"
                            : "bg-muted text-foreground rounded-r-2xl rounded-l-md",
                          isFirstInGroup && (isOwn ? "rounded-tr-2xl" : "rounded-tl-2xl"),
                          isLastInGroup && (isOwn ? "rounded-br-2xl" : "rounded-bl-2xl")
                        )}
                      >
                        {isOwn && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this message?")) {
                                deleteMessage(msg.id);
                              }
                            }}
                            className="mr-2 left-0 bottom-0 top-0 -translate-x-10 absolute rounded-2xl text-red-400 cursor-pointer opacity-0 group-hover/message:opacity-100 transition-opacity"
                          >
                           <div className="p-1.5 border rounded-full bg-muted/70 backdrop-blur-2xl">
                             <MdDelete className="h-4.5 w-4.5 "  />
                           </div>
                          </button>
                        )}
                        {codeBlock ? (
                          <div className="space-y-2 my-1 min-w-[200px]">
                            <div className="flex items-center justify-between text-[10px] opacity-70 border-b border-primary-foreground/20 pb-1 mb-2">
                              <span className="font-mono">{codeBlock.language}</span>
                              <Code className="h-3 w-3" />
                            </div>
                            <pre className="text-xs font-mono bg-black/20 p-2.5 rounded border border-white/10 overflow-x-auto">
                              <code>{codeBlock.code}</code>
                            </pre>
                          </div>
                        ) : msg.type === 'audio' ? (
                          <div className="flex items-center gap-3 pr-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playAudio(msg.content, msg.id)}
                              className={cn(
                                "h-8 w-8 p-0 rounded-full hover:bg-black/10",
                                isOwn ? "text-primary-foreground" : "text-foreground hover:bg-white/10"
                              )}
                            >
                              {audioPlaying === msg.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                            </Button>
                            <div className="flex items-end h-5 space-x-0.5">
                              {[...Array(12)].map((_, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "w-0.5 rounded-full transition-all duration-300",
                                    isOwn ? "bg-primary-foreground/50" : "bg-foreground/40",
                                    audioPlaying === msg.id && "animate-[wave_1s_ease-in-out_infinite]"
                                  )}
                                  style={{
                                    height: `${Math.max(4, Math.random() * 16)}px`,
                                    animationDelay: `${idx * 0.1}s`
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] opacity-70 tabular-nums">Audio</span>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {renderFormattedMessage(msg.content, msg.mentionedUsers || [])}
                          </div>
                        )}

                        {/* Message Meta */}
                        <div className={cn(
                          "text-[9px] opacity-50 mt-1 flex items-center gap-1 select-none",
                          isOwn ? "justify-end text-primary-foreground/80" : "justify-start text-muted-foreground"
                        )}>
                          {formatTime(msg.timestamp)}

                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Typing Indicators */}
          <AnimatePresence>
            {displayTypingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-end gap-2 ml-1"
              >
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm border border-border">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-muted-foreground pb-1">
                  {displayTypingUsers.join(", ")} is typing...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-transparent  border-t border-border z-20">
        <AnimatePresence>
          {(showCodeBlock || recordedAudio) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 overflow-hidden"
            >
              {showCodeBlock ? (
                <div className="bg-muted/50 rounded-lg border border-border p-3">
                  <div className="flex justify-between items-center mb-2">
                    <select
                      value={codeLanguage}
                      onChange={e => setCodeLanguage(e.target.value)}
                      className="bg-background text-xs text-foreground border border-border rounded-md px-2 py-1 outline-none focus:border-primary"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                    </select>
                    <button onClick={() => setShowCodeBlock(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    value={codeContent}
                    onChange={e => setCodeContent(e.target.value)}
                    placeholder="Paste code here..."
                    className="w-full bg-transparent text-sm font-mono text-foreground resize-none outline-none h-24 placeholder:text-muted-foreground"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">Audio Recording</div>
                    <div className="text-[10px] text-muted-foreground">Ready to send</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setRecordedAudio(null)} className="h-7 text-xs hover:bg-background">Delete</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            {!isRecording ? (
              <div className="relative flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-transparent shrink-0"
                  onClick={() => setShowCodeBlock(!showCodeBlock)}
                >
                  <Code className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    ref={inputRef}
                    placeholder="Type a message... (@ to mention)"
                    className="flex-1 border-none bg-transparent h-auto p-0 placeholder:text-muted-foreground focus-visible:ring-0 shadow-none"
                    disabled={!isConnected}
                  />
                  {showMentions && (
                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-popover border border-border rounded-md shadow-lg">
                      {filteredParticipants.map((participant, index) => (
                        <div
                          key={participant.id}
                          className={cn(
                            "px-4 py-2 cursor-pointer hover:bg-accent",
                            index === mentionIndex && "bg-accent"
                          )}
                          onMouseDown={() => handleMentionSelect(participant.username)}
                        >
                          {participant.username}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
                  onClick={startRecording}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-mono text-destructive tabular-nums flex-1">
                  {formatTimeSeconds(recordingTime)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={stopRecording}
                >
                  Stop
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="icon"
            className="rounded-xl h-[42px] w-[42px] shrink-0 transition-all hover:scale-105"
            disabled={(!newMessage.trim() && !codeContent && !recordedAudio) || !isConnected}
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
