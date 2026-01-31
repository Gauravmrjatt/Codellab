"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  Calendar, 
  Clock, 
  Copy, 
  Share2,
  Settings,
  Plus,
  ArrowRight,
  Globe,
  Lock
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Room {
  id: string
  name: string
  description: string
  inviteCode: string
  participants: number
  maxParticipants: number
  isPublic: boolean
  createdAt: Date
  lastActivity: Date
  tags: string[]
}

interface RoomManagerProps {
  onRoomSelect?: (roomId: string) => void
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Dynamic Programming Practice",
    description: "Practice dynamic programming problems together",
    inviteCode: "DP-2024",
    participants: 4,
    maxParticipants: 10,
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 15 * 60 * 1000),
    tags: ["algorithms", "dp", "medium"]
  },
  {
    id: "2",
    name: "LeetCode Contest Prep",
    description: "Preparing for weekly contest",
    inviteCode: "CONTEST-123",
    participants: 8,
    maxParticipants: 20,
    isPublic: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    tags: ["contest", "leetcode", "competitive"]
  },
  {
    id: "3",
    name: "System Design Study Group",
    description: "Learning system design concepts",
    inviteCode: "SYSTEM-DESIGN",
    participants: 2,
    maxParticipants: 5,
    isPublic: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ["system-design", "interview", "senior"]
  }
]

export function RoomManager({ onRoomSelect }: RoomManagerProps) {
  const router = useRouter()
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState(10)

  const handleJoinRoom = (roomId: string) => {
    if (onRoomSelect) {
      onRoomSelect(roomId)
    } else {
      router.push(`/editor?room=${roomId}`)
    }
  }

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    
    // Find room by invite code
    const room = mockRooms.find(r => r.inviteCode === joinCode.toUpperCase())
    if (room) {
      handleJoinRoom(room.id)
    } else {
      alert("Invalid invite code")
    }
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    // Generate invite code
    const inviteCode = newRoomName
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase() + "-" + Math.random().toString(36).substr(2, 4).toUpperCase()

    const newRoom: Room = {
      id: Date.now().toString(),
      name: newRoomName,
      description: newRoomDescription,
      inviteCode,
      participants: 1,
      maxParticipants,
      isPublic,
      createdAt: new Date(),
      lastActivity: new Date(),
      tags: []
    }

    // Add to rooms and join
    mockRooms.unshift(newRoom)
    handleJoinRoom(newRoom.id)
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert("Invite code copied to clipboard!")
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">CodeLab Rooms</h1>
        <p className="text-muted-foreground">
          Join collaborative coding sessions or create your own room
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Join a room with an invite code or create a new room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Join by Code */}
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="join-code">Join with Invite Code</Label>
                <Input
                  id="join-code"
                  placeholder="Enter invite code (e.g., DP-2024)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="mt-7">
                Join Room
              </Button>
            </form>

            {/* Create Room */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="outline"
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Room
              </Button>
            </div>

            {/* Create Room Form */}
            {showCreateForm && (
              <form onSubmit={handleCreateRoom} className="space-y-4 p-4 border rounded-lg">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="My Coding Room"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-participants">Max Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      min="2"
                      max="50"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="room-description">Description</Label>
                  <Input
                    id="room-description"
                    placeholder="What will you be working on?"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is-public">
                    Make this room public (visible to everyone)
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Create Room
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Available Rooms</h2>
          <Badge variant="secondary">
            {mockRooms.length} rooms
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {room.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {room.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {room.isPublic ? (
                      <Globe className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Room Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{room.participants}/{room.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTimeAgo(room.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(room.lastActivity)}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {room.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Invite Code */}
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <code className="text-xs font-mono flex-1">{room.inviteCode}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyInviteCode(room.inviteCode)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleJoinRoom(room.id)}
                    className="flex-1"
                    disabled={room.participants >= room.maxParticipants}
                  >
                    Join Room
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}