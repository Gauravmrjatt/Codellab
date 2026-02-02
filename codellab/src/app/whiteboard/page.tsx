'use client'

import { Excalidraw } from "@excalidraw/excalidraw"

export default function WhiteboardPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        height: '100vh',
        width: '100vw',
        background: '#1e1e1e',
      }}
    >
      <Excalidraw theme="dark" />
    </div>
  )
}
