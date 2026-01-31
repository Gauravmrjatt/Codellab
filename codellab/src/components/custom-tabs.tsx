import React from "react"
import type { IDockviewPanelHeaderProps } from "dockview"
import { File, Code, Play, Terminal } from "lucide-react"
import { IoCheckboxOutline } from "react-icons/io5"
import { FaBloggerB, FaFolderClosed, FaUsers, FaNoteSticky } from "react-icons/fa6"
import { FaHistory } from "react-icons/fa"
import { IoIosChatbubbles, IoIosClose } from "react-icons/io"
import { MdDraw } from "react-icons/md"

type TabConfig = {
  Icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
  closable?: boolean
}

const TAB_CONFIG: Record<string, TabConfig> = {
  files: { Icon: FaFolderClosed, color: "#007CFF" },
  participants: { Icon: FaUsers, color: "#29C244" },
  chat: { Icon: IoIosChatbubbles, color: "#FFB700" },
  editor: { Icon: Code, color: "#007CFF" },
  output: { Icon: Play, color: "#29C244" },
  console: { Icon: Terminal, color: "#29C244" },
  note: { Icon: FaNoteSticky, color: "#FFB700" , closable : true },
  whiteboard: { Icon: MdDraw, color: "#FD8DA3", closable: true },
  "test-cases": { Icon: IoCheckboxOutline, color: "#29C244" },
  "problem-description": { Icon: FaBloggerB, color: "#ff673a" },
  submission: { Icon: FaHistory, color: "#615FFF"  , closable : true},
}

export function CustomTab({ api }: IDockviewPanelHeaderProps) {
  const { Icon, color, closable } = TAB_CONFIG[api.id] ?? {
    Icon: File,
    color: "#6B7280",
  }

  const closePanel = (e: React.MouseEvent) => {
  e.stopPropagation()
  api.close()
}

  

  return (
    <div
      className={`group flex items-center gap-2 ${closable ? "pl-0" : "px-3"} pt-1 select-none cursor-pointer`}
      onClick={() => api.setActive()}
    >
      <Icon size={16} color={color} />

      <span className="text-sm font-medium truncate">
        {api.title}
      </span>

      {closable && (
        <button
          onClick={closePanel}
          className="rounded-full opacity-0 group-hover:opacity-100
                     hover:bg-primary/10 transition p-0.5"
        >
          <IoIosClose size={18} />
        </button>
      )}
    </div>
  )
}
