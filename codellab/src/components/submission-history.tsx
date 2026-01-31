"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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

export function SubmissionHistory({ questionId }: SubmissionHistoryProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true)
            try {
                const url = questionId ? `/api/submissions?questionId=${questionId}` : `/api/submissions`
                const response = await fetch(url)
                if (!response.ok) {
                    if (response.status === 401) {
                        // User not logged in, just return empty list or handle gracefully
                        // For now, we'll assume the parent component handles auth or we just show nothing
                        setSubmissions([])
                        return
                    }
                    throw new Error("Failed to fetch submissions")
                }
                const data = await response.json()
                setSubmissions(data)
            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [questionId])

    if (loading) {
        return <div className="p-4 text-center text-muted-foreground">Loading submissions...</div>
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error: {error}</div>
    }

    if (submissions.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No submissions yet</div>
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return { icon: CheckCircle, color: "text-green-500", badge: "bg-green-100 text-green-700 hover:bg-green-100" }
            case "WRONG_ANSWER":
                return { icon: XCircle, color: "text-red-500", badge: "bg-red-100 text-red-700 hover:bg-red-100" }
            case "PENDING":
                return { icon: Clock, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" }
            default:
                return { icon: AlertTriangle, color: "text-gray-500", badge: "bg-gray-100 text-gray-700 hover:bg-gray-100" }
        }
    }

    return (
        <ScrollArea className="h-[calc(100vh-350px)]">
            <Table>
                <TableHeader>
                    <TableRow>
                        {!questionId && <TableHead>Question</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Runtime</TableHead>
                        <TableHead>Memory</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.map((submission) => {
                        const config = getStatusConfig(submission.status)
                        const Icon = config.icon

                        return (
                            <TableRow key={submission.id}>
                                {!questionId && (
                                    <TableCell className="font-medium">
                                        {submission.question?.title || "Unknown"}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Badge variant="secondary" className={`w-fit flex items-center gap-1 ${config.badge}`}>
                                            <Icon className="h-3 w-3" />
                                            {submission.status.replace(/_/g, " ")}
                                        </Badge>
                                        {submission.passedTests !== null && submission.totalTests !== null && submission.status !== 'ACCEPTED' && (
                                            <span className="text-xs text-muted-foreground">
                                                {submission.passedTests}/{submission.totalTests} tests passed
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {submission.runtime ? `${submission.runtime}ms` : "-"}
                                </TableCell>
                                <TableCell>
                                    {submission.memory ? `${submission.memory}MB` : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {format(new Date(submission.createdAt), "MMM d, yyyy HH:mm")}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
    )
}
