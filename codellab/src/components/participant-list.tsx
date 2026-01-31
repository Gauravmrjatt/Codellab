"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Crown,
  Pencil,
  Eye,
  MoreVertical,
  UserPlus,
  Search,
  Settings,
  Check,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWS } from "@/context/WebSocketProvider"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Participant } from "@/types/editor-panel";
import { Separator } from "./ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ParticipantWithPermissions extends Participant {
  canWriteCode?: boolean;
  canWriteNotes?: boolean;
  canDraw?: boolean;
}

interface ParticipantListProps {
  participants?: ParticipantWithPermissions[]
}

function PermissionRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 b">
      <Label className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-emerald-500"
      />
    </div>
  )
}


export function ParticipantList({ participants: propParticipants }: ParticipantListProps) {
  const { participants: wsParticipants, userId, socket, roomId } = useWS() // Assuming roomId is available in the WebSocket context

  // Use prop participants if available (merged list), otherwise fallback to WS participants
  // We need to cast wsParticipants to ParticipantWithPermissions[] as the type matches closely enough for our needs
  const participants = (propParticipants || wsParticipants || []) as ParticipantWithPermissions[]

  const [searchQuery, setSearchQuery] = useState("")
  const [adminControlsOpen, setAdminControlsOpen] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Record<string, { canWriteCode: boolean; canWriteNotes: boolean; canDraw: boolean }>>({})
  const [roomCreator, setRoomCreator] = useState<{ id: string; username: string; avatarUrl?: string } | null>(null)

  // Initialize permissions from participants
  useEffect(() => {
    const initialPermissions: Record<string, { canWriteCode: boolean; canWriteNotes: boolean; canDraw: boolean }> = {}
    participants.forEach(participant => {
      initialPermissions[participant.id] = {
        canWriteCode: participant.canWriteCode ?? (participant.role !== "reader"),
        canWriteNotes: participant.canWriteNotes ?? (participant.role !== "reader"),
        canDraw: participant.canDraw ?? (participant.role !== "reader")
      }
    })
    setPermissions(initialPermissions)
  }, [participants])

  // Fetch room creator information
  useEffect(() => {
    if (roomId && socket) {
      const fetchRoomCreator = async () => {
        try {
          // Use the same authentication method as other API calls
          const response = await fetch(`/api/rooms/${roomId}/creator`, {
            credentials: 'include', // Include cookies for authentication
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            setRoomCreator(data.creator);
          } else {
            console.error('Failed to fetch room creator:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching room creator:', error);
        }
      };

      fetchRoomCreator();
    }
  }, [roomId, socket])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Admin</Badge>
      case "writer":
        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">Writer</Badge>
      case "reader":
        return <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">Reader</Badge>
      default:
        return null
    }
  }

  const isCurrentUserAdmin = participants.find(p => p.id === userId)?.role === "admin"

  const handleRoleChange = (participantId: string, newRole: "admin" | "writer" | "reader") => {
    if (socket) {
      const query = socket.io.opts.query as { roomId: string };
      socket.emit("user:role-change", {
        roomId: query.roomId,
        userId: participantId,
        newRole,
        changerId: userId
      })
    }
    setAdminControlsOpen(null)
  }

  const handlePermissionToggle = (participantId: string, permission: "canWriteCode" | "canWriteNotes" | "canDraw", value: boolean) => {
    if (socket) {
      const newPermissions = {
        ...permissions[participantId],
        [permission]: value
      }

      const query = socket.io.opts.query as { roomId: string };
      socket.emit("user:permission-change", {
        roomId: query.roomId,
        userId: participantId,
        permissions: newPermissions,
        changerId: userId
      })

      setPermissions(prev => ({
        ...prev,
        [participantId]: newPermissions
      }))
    }
  }

  const filteredParticipants = participants.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sorting: admins > writers > readers, then online first, then alphabetical
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    const roleOrder: Record<string, number> = { admin: 0, writer: 1, reader: 2 }
    const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99)
    if (roleDiff !== 0) return roleDiff
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    return a.username.localeCompare(b.username)
  })

  return (
    <div className="flex flex-col h-full  backdrop-blur-sm border-0 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border  space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight text-foreground">Participants</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {participants.length}
            </span>
          </div>
       
        </div>

        {/* Room Creator Information */}
        {roomCreator && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Created by:</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5 border border-border/50">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {roomCreator.username[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground">
                {roomCreator.username}
              </span>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="h-8 pl-8 text-xs bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1  scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {sortedParticipants.map((participant) => {
            const isCurrentUser = participant.id === userId
            const participantPermissions = permissions[participant.id] || { canWriteCode: true, canWriteNotes: true, canDraw: true }

            return (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={participant.id}
                className={cn(
                  "group relative rounded-lg border border-transparent transition-all mt-2",
                  isCurrentUser
                    ? "bg-primary/5 border-primary/10"
                    : "hover:bg-muted/50 hover:border-border/50"
                )}
              >
                <Accordion type="single" collapsible>
                  <AccordionItem value="permissions" className="border-none">

                    {/* ================= HEADER ROW ================= */}
                    <AccordionTrigger
                      className="flex w-full items-center gap-3 p-2.5 hover:no-underline"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-medium bg-gradient-to-br from-muted to-muted/50 text-muted-foreground",
                              isCurrentUser &&
                              "from-primary/20 to-primary/5 text-primary"
                            )}
                          >
                            {participant.username[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>

                        {participant.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-medium text-sm truncate",
                              isCurrentUser ? "text-primary" : "text-foreground"
                            )}
                          >
                            {participant.username}
                          </span>

                          {isCurrentUser && (
                            <span className="text-[10px] text-muted-foreground bg-background/50 px-1 rounded border border-border/50">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getRoleBadge(participant.role)}
                          {!participant.isOnline && participant.lastSeen && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              Last seen{" "}
                              {new Date(participant.lastSeen).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right-side Actions (Settings) */}
                      {isCurrentUserAdmin && participant.role !== "admin" && (
                        <div
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()} // prevent accordion toggle
                        >
                          <DropdownMenu
                            open={adminControlsOpen === participant.id}
                            onOpenChange={(open) =>
                              setAdminControlsOpen(open ? participant.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-background rounded-full"
                              >
                                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(participant.id, "writer")
                                }
                                className={
                                  participant.role === "writer" ? "bg-accent" : ""
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Writer
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(participant.id, "reader")
                                }
                                className={
                                  participant.role === "reader" ? "bg-accent" : ""
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Reader
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </AccordionTrigger>

                    {/* ================= PERMISSIONS (EXPANDED) ================= */}
                    {isCurrentUserAdmin && participant.role !== "admin" && (
                      <AccordionContent className="px-12 pb-3 pt-5 space-y-2 flex justify-between items-center border-t">
                        <PermissionRow
                          label="Code"
                          checked={participantPermissions.canWriteCode}
                          onChange={(val) =>
                            handlePermissionToggle(
                              participant.id,
                              "canWriteCode",
                              val
                            )
                          }
                        />
                        <PermissionRow
                          label="Notes"
                          checked={participantPermissions.canWriteNotes}
                          onChange={(val) =>
                            handlePermissionToggle(
                              participant.id,
                              "canWriteNotes",
                              val
                            )
                          }
                        />

                        <PermissionRow
                          label="Board"
                          checked={participantPermissions.canDraw}
                          onChange={(val) =>
                            handlePermissionToggle(
                              participant.id,
                              "canDraw",
                              val
                            )
                          }
                        />
                      </AccordionContent>
                    )}
                  </AccordionItem>
                </Accordion>
              </motion.div>

            )
          })}
        </AnimatePresence>

        {sortedParticipants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-xs">No participants found</p>
          </div>
        )}
      </div>
    </div>
  )
}