"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface Submission {
  id: string
  status: string
  runtime: number | null
  memory: number | null
  passedTests: number | null
  totalTests: number | null
  createdAt: string
  language: string
  question?: {
    title: string
    slug: string
  }
}

interface SubmissionHistoryProps {
  questionId?: string
}

const statusMap: Record<
  string,
  { label: string; className: string }
> = {
  ACCEPTED: {
    label: "Accepted",
    className: "text-green-600",
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    className: "text-red-600",
  },
  RUNTIME_ERROR: {
    label: "Wrong Answer",
    className: "text-red-600",
  },
  PENDING: {
    label: "Pending",
    className: "text-yellow-600",
  },
}

export function SubmissionHistory({ questionId }: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      const url = questionId
        ? `/api/submissions?questionId=${questionId}`
        : `/api/submissions`

      const res = await fetch(url)
      if (res.ok) {
        setSubmissions(await res.json())
      }
      setLoading(false)
    }

    fetchSubmissions()
  }, [questionId])

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (!submissions.length) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No submissions yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-350px)] p-2">
      <Table className="">
        <TableHeader>
          <TableRow className="border-b">
            {!questionId && <TableHead>Question</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Runtime</TableHead>
            <TableHead>Memory</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {submissions.map((s) => {
            const status =
              statusMap[s.status] ?? {
                label: s.status,
                className: "text-muted-foreground",
              }

            return (
              <TableRow
                key={s.id}
                className="hover:bg-muted/40 transition-colors"
              >
                {!questionId && (
                  <TableCell className="font-medium">
                    {s.question?.title ?? "Unknown"}
                  </TableCell>
                )}

                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${status.className.replace(
                        "text",
                        "bg"
                      )}`}
                    />
                    <span className={status.className}>
                      {status.label}
                    </span>
                  </div>

               
                </TableCell>

                {/* Runtime */}
                <TableCell className="text-muted-foreground">
                  {s.runtime ? `${s.runtime} ms` : "—"}
                </TableCell>

                {/* Memory */}
                <TableCell className="text-muted-foreground">
                  {s.memory ? `${s.memory} MB` : "—"}
                </TableCell>

                {/* Language */}
                <TableCell className="text-muted-foreground">
                  {s.language}
                </TableCell>

                {/* Date */}
                <TableCell className="text-muted-foreground text-xs">
                  {format(new Date(s.createdAt), "MMM d · HH:mm")}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
