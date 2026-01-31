"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  solvedProblems: number
  totalTime: number
  lastSubmission: Date | string
}

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[]
  currentUsername: string
}

export function LeaderboardPanel({ leaderboard, currentUsername }: LeaderboardPanelProps) {
  return (
    <Card className="h-full border-0 bg-transparent shadow-none">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium">Contest Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="space-y-1 p-2">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center justify-between p-2 rounded-md text-sm ${
                entry.username === currentUsername ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    entry.rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                    entry.rank === 2 ? "bg-gray-400/20 text-gray-600" :
                    entry.rank === 3 ? "bg-orange-600/20 text-orange-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium leading-none">{entry.username}</span>
                    {entry.username === currentUsername && (
                      <span className="text-[10px] text-muted-foreground">You</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium">{entry.score}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {entry.solvedProblems} solved
                  </div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No participants yet
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}