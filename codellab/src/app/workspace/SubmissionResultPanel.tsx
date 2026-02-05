"use client"
import { SubmissionHistory } from "@/components/submission-history"

import * as React from "react"
import { CheckCircle2, XCircle, Clock, Zap, ChevronRight, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

type TestResult = {
  input: any[]
  expectedOutput: any
  actualOutput: any
  passed: boolean
  runtime: number
}

type SubmissionResultPanelProps = {
  verdict: "ACCEPTED" | "WRONG_ANSWER" | "TLE" | "MLE"
  runtime: number
  memory: number
  passedTests: number
  totalTests: number
  results: TestResult[]
  forType?: string
}

export function SubmissionResultPanel({
  verdict,
  runtime,
  memory,
  passedTests,
  totalTests,
  results,
  forType
}: SubmissionResultPanelProps) {
  const isAccepted = verdict === "ACCEPTED"

  // LeetCode specific color mapping
  const statusColor = isAccepted
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 ">
      {/* Status Header */}
      {forType === "history" ? <><SubmissionHistory /></> : <div className="w-full max-w-3xl mx-auto space-y-6 p-7">
        <div className="space-y-2">
          <h1 className={cn("text-2xl font-bold tracking-tight", statusColor)}>
            {verdict === "ACCEPTED" ? "Accepted" : verdict.replace("_", " ")}
          </h1>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/60 border-none shadow-none">
            <CardContent className="p-4 flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Testcases Passed</span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{passedTests} / {totalTests}</span>
                <span className="text-xs text-muted-foreground mb-1.5">passed</span>
              </div>
            </CardContent>
          </Card>
          {/* You could add a "Beats X%" card here if you have that data */}
        </div>

        {/* Test Case Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Testcase Results</h3>
          </div>

          <Tabs defaultValue="case-0" className="w-full">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start border dark:border-zinc-800">
              {results.map((res, idx) => (
                <TabsTrigger
                  key={idx}
                  value={`case-${idx}`}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      res.passed ? "bg-green-500" : "bg-red-500"
                    )} />
                    Case {idx + 1}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {results.map((test, idx) => (
              <TabsContent key={idx} value={`case-${idx}`} className="mt-4 space-y-4 animate-in fade-in-50 duration-200">
                {/* Input Section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Input</p>
                  <div className="p-3 rounded-md bg-muted/50 font-mono text-sm border dark:border-zinc-800">
                    {JSON.stringify(test.input)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Output Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Output</p>
                    <div className={cn(
                      "p-3 rounded-md font-mono text-sm border",
                      test.passed ? "bg-muted/30 border-zinc-200 dark:border-zinc-800" : "bg-red-500/5 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
                    )}>
                      {JSON.stringify(test.actualOutput)}
                    </div>
                  </div>

                  {/* Expected Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Expected</p>
                    <div className="p-3 rounded-md bg-muted/30 font-mono text-sm border dark:border-zinc-800">
                      {JSON.stringify(test.expectedOutput)}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        </div>
      }

    </div>
  )
}