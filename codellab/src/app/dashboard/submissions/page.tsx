import { SubmissionHistory } from "@/components/submission-history"

export default function SubmissionsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Submission History</h2>
            </div>
            <div className="h-full border rounded-lg p-4">
                <SubmissionHistory />
            </div>
        </div>
    )
}
