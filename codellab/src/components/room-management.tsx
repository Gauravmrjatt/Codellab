"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Hash, Settings, Copy, Check } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useRooms, type Room as APIRoom } from "@/hooks/useRooms"
import { useEffect } from "react"
import Link from "next/link"
import {ArrowLeft} from "lucide-react"
interface Room {
  id: string
  name: string
  description: string
  participants: number
  maxParticipants: number
  language: string
  difficulty: "easy" | "medium" | "hard"
  isPrivate: boolean
  inviteCode?: string
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Binary Search Practice",
    description: "Practice binary search algorithms together",
    participants: 3,
    maxParticipants: 5,
    language: "javascript",
    difficulty: "medium",
    isPrivate: false
  },
  {
    id: "2",
    name: "Dynamic Programming",
    description: "Solve DP problems collaboratively",
    participants: 2,
    maxParticipants: 4,
    language: "python",
    difficulty: "hard",
    isPrivate: false
  },
  {
    id: "3",
    name: "Array Manipulation",
    description: "Work on array algorithms",
    participants: 1,
    maxParticipants: 6,
    language: "java",
    difficulty: "easy",
    isPrivate: false
  }
]

export function RoomManagement({ showOnlyMyRooms = false }: { showOnlyMyRooms?: boolean }) {
  const router = useRouter()
  const { createRoom, getPublicRooms, getMyRooms, joinRoomByInvite, joinRoom, loading, error: apiError } = useRooms()
  const [rooms, setRooms] = useState<APIRoom[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form states
  const [roomName, setRoomName] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("5")
  const [language, setLanguage] = useState("javascript")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteCode, setInviteCode] = useState("")

  useEffect(() => {
    if (showOnlyMyRooms) {
      getMyRooms().then(data => {
        if (data) setRooms(data as unknown as APIRoom[])
      })
    } else {
      getPublicRooms().then(data => {
        if (data) setRooms(data as unknown as APIRoom[])
      })
    }
  }, [getPublicRooms, getMyRooms, showOnlyMyRooms])

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name")
      return
    }

    const room = await createRoom(roomName, !isPrivate)

    if (room) {
      setRooms([room as unknown as APIRoom, ...rooms])
      setCreateDialogOpen(false)
      toast.success(isPrivate ? `Room created with invite code: ${room.inviteCode}` : "Room created successfully")

      // Reset form
      setRoomName("")
      setRoomDescription("")
      setIsPrivate(false)

      router.push(`/workspace?room=${room.id}`)
    } else {
      toast.error(apiError || "Failed to create room")
    }
  }

  const handleJoinRoom = async (room: APIRoom) => {
    if ((room._count?.members || 0) >= room.maxParticipants) {
      toast.error("This room has reached maximum capacity")
      return
    }

    const success = await joinRoom(room.id)
    if (success) {
      toast.success(`Successfully joined ${room.name}`)
      router.push(`/workspace?room=${room.id}`)
    } else {
      toast.error("Failed to join room")
    }
  }

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code")
      return
    }

    try {
      const room = await joinRoomByInvite(inviteCode)
      if (room) {
        const success = await joinRoom(room.id, inviteCode)
        if (success) {
          toast.success(`Joining room...`)
          router.push(`/workspace?room=${room.id}`)
          setJoinDialogOpen(false)
          setInviteCode("")
        } else {
          toast.error("Failed to join room")
        }
      } else {
        toast.error("Invalid invite code or room not found")
      }
    } catch (e) {
      toast.error("Failed to join room")
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success("Invite code copied to clipboard")
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-400 border-green-400/20 bg-green-400/10"
      case "medium": return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
      case "hard": return "text-red-400 border-red-400/20 bg-red-400/10"
      default: return "text-muted-foreground border-border"
    }
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      javascript: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      python: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      java: "bg-red-500/10 text-red-500 border-red-500/20",
      cpp: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      csharp: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    }
    return colors[language] || "bg-secondary text-secondary-foreground border-border"
  }

  return (
    <>
      <Toaster />
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back 
            </Link>
          </Button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight ">Collaborative Rooms</h1>
            <p className="text-muted-foreground text-lg">
              Join rooms to solve coding problems together in real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#edae00]/20 hover:bg-[#edae00]/10 hover:text-[#edae00]">
                  <Hash className="mr-2 h-4 w-4" />
                  Join with Code
                </Button>
              </DialogTrigger>
              <DialogContent className="border-[#edae00]/20 bg-background/95 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle>Join Room with Invite Code</DialogTitle>
                  <DialogDescription>
                    Enter the invite code shared by the room creator
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="uppercase border-[#edae00]/20 focus-visible:ring-[#edae00]/50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinWithCode} className="bg-[#edae00] text-black hover:bg-[#d49b00]">
                    Join Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#edae00] text-black hover:bg-[#d49b00] font-semibold">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md border-[#edae00]/20 bg-background/95 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Set up a room for collaborative coding
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name"
                      className="border-[#edae00]/20 focus-visible:ring-[#edae00]/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={roomDescription}
                      onChange={(e) => setRoomDescription(e.target.value)}
                      placeholder="What's this room about?"
                      className="border-[#edae00]/20 focus-visible:ring-[#edae00]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="border-[#edae00]/20 focus:ring-[#edae00]/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="csharp">C#</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
                        <SelectTrigger className="border-[#edae00]/20 focus:ring-[#edae00]/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                      <SelectTrigger className="border-[#edae00]/20 focus:ring-[#edae00]/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-[#edae00]/50 text-[#edae00] focus:ring-[#edae00]/50"
                    />
                    <Label htmlFor="private" className="text-sm">
                      Private room (requires invite code)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} className="bg-[#edae00] text-black hover:bg-[#d49b00]">Create Room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="group hover:shadow-lg transition-all duration-300 border-white/10 bg-white/5 backdrop-blur-sm hover:border-[#edae00]/30 hover:-translate-y-1">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold group-hover:text-[#edae00] transition-colors">{room.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {room.description}
                    </CardDescription>
                  </div>
                  {!room.isPublic && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded border border-border">
                        Private
                      </span>
                      {room.inviteCode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteCode(room.inviteCode!)}
                          className="h-6 px-2 hover:bg-white/10"
                        >
                          {copiedCode === room.inviteCode ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{room._count?.members || 0}/{room.maxParticipants}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyColor(room.difficulty || "medium")}`}>
                      {room.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLanguageColor(room.language)}`}>
                      {room.language}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleJoinRoom(room as any)}
                    className="w-full bg-[#edae00]/10 text-[#edae00] border border-[#edae00]/20 hover:bg-[#edae00] hover:text-black font-semibold transition-all"
                    disabled={(room._count?.members || 0) >= room.maxParticipants}
                  >
                    {(room._count?.members || 0) >= room.maxParticipants ? "Room Full" : "Join Room"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
            <div className="mx-auto h-16 w-16 bg-[#edae00]/10 rounded-full flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-[#edae00]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No rooms available</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              There are no active rooms right now. Create a new room to start collaborating!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#edae00] text-black hover:bg-[#d49b00] h-12 px-8">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Room
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
