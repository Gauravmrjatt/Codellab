"use client"
import { RoomManagement } from "@/components/room-management"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
export default function RoomsPage() {
  return (
    <div className="pt-20">

      <RoomManagement />
    </div>
  )
}