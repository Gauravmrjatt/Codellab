'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Clock,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
type Mode = 'stopwatch' | 'timer'

const DEFAULT_MINUTES = 25

export function TimerPopover() {
  const [mode, setMode] = useState<Mode>('timer')
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(DEFAULT_MINUTES)

  // Engine
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      setSeconds((prev) => (mode === 'timer' ? Math.max(0, prev - 1) : prev + 1))
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning, mode])

  const start = useCallback(() => {
    if (mode === 'timer' && seconds === 0) {
      setSeconds(timerMinutes * 60)
    }
    setIsRunning(true)
  }, [mode, seconds, timerMinutes])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec
        .toString()
        .padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const isTimer = mode === 'timer'
  const isActive = seconds > 0 || isRunning

  // ── Idle state: just icon ─────────────────────────────────────
  if (!isActive) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-r-none p-2.5 bg-(--group-color) cursor-pointer"
            title="Open timer / stopwatch"
          >
            {isTimer ? (
              <TimerIcon className="h-7 w-7 text-yellow-500" />
            ) : (
              <Clock className="h-7 w-7 text-blue-500" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-5 space-y-5">
          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('stopwatch')
                reset()
              }}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-medium transition-all',
                mode === 'stopwatch'
                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200'
                  : 'border-border hover:border-accent hover:bg-accent/60'
              )}
            >
              <Clock className="mb-2 h-9 w-9" />
              Stopwatch
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('timer')
                reset()
              }}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-medium transition-all',
                mode === 'timer'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-400 dark:bg-yellow-950/30 dark:text-yellow-200'
                  : 'border-border hover:border-accent hover:bg-accent/60'
              )}
            >
              <TimerIcon className="mb-2 h-9 w-9" />
              Timer
            </button>
          </div>

          {isTimer && (
            <div className="space-y-2.5">
              <Label htmlFor="minutes" className="text-sm font-medium">
                Duration (minutes)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTimerMinutes((v) => Math.max(1, v - 5))}
                  disabled={timerMinutes <= 5}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <Input
                  id="minutes"
                  type="number"
                  min={1}
                  max={180}
                  value={timerMinutes}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v)) setTimerMinutes(Math.max(1, Math.min(180, v)))
                  }}
                  className="h-9 w-16 text-center tabular-nums"
                />

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTimerMinutes((v) => Math.min(180, v + 5))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={start}>
            Start
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ── Active state: left control • time • right reset ────────────
  return (
    <div className="inline-flex items-center  rounded-md border-(--group-color) bg-(--group-color) shadow-sm rounded-r-none h-9">
      {/* Left: Play / Pause */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-r-none"
        onClick={isRunning ? pause : start}
        title={isRunning ? 'Pause' : seconds > 0 ? 'Resume' : 'Start'}
      >
        {isRunning ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Middle: Time display – opens dropdown */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'h-9 px-2  tabular-nums text-base font-medium min-w-[30px] hover:bg-transparent focus:bg-transparent',
              isTimer ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
            )}
          >
            {formatTime(seconds)}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-5 space-y-5">
          {/* same content as above – modes, duration, etc */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('stopwatch')
                reset()
              }}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-medium transition-all',
                mode === 'stopwatch'
                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-200'
                  : 'border-border hover:border-accent hover:bg-accent/60'
              )}
            >
              <Clock className="mb-2 h-9 w-9" />
              Stopwatch
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('timer')
                reset()
              }}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-medium transition-all',
                mode === 'timer'
                  ? 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-400 dark:bg-yellow-950/30 dark:text-yellow-200'
                  : 'border-border hover:border-accent hover:bg-accent/60'
              )}
            >
              <TimerIcon className="mb-2 h-9 w-9" />
              Timer
            </button>
          </div>

          {isTimer && !isRunning && (
            <div className="space-y-2">
              <Label htmlFor="minutes" className="text-sm font-medium">
                Duration (minutes)
              </Label>
              <div style={{justifyContent : "center"}} className="flex items-center gap-2 w-full">
                <Button variant="outline" size="icon" className="h-9 w-9 w-full" onClick={() => setTimerMinutes(v => Math.max(1, v - 5))} disabled={timerMinutes <= 5}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Input
                  id="minutes"
                  type="number"
                  min={1}
                  max={180}
                  value={timerMinutes}
                  onChange={e => {
                    const v = Number(e.target.value)
                    if (!isNaN(v)) setTimerMinutes(Math.max(1, Math.min(180, v)))
                  }}
                  className="h-9 w-full flex-1 text-center tabular-nums"
                />
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setTimerMinutes(v => Math.min(180, v + 5))}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Button variant={isRunning ? 'outline' : 'default'} className="w-full" onClick={isRunning ? pause : start}>
            {isRunning ? 'Pause' : 'Resume'}
          </Button>

          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={reset}>
            Reset
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: Reset */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={reset}
        title="Reset"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}