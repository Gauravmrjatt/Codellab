'use client'

import { Tldraw } from 'tldraw'

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
      <Tldraw />
    </div>
  )
}
