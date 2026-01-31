"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Search, Trophy } from "lucide-react"
import Link from "next/link"

const contestSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    questionIds: z.array(z.string()).min(1, "Select at least one problem"),
})

type ContestFormValues = z.infer<typeof contestSchema>

export default function CreateContestPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [problems, setProblems] = useState<any[]>([])
    const [search, setSearch] = useState("")

    const form = useForm<ContestFormValues>({
        resolver: zodResolver(contestSchema),
        defaultValues: {
            title: "",
            description: "",
            startTime: "",
            endTime: "",
            questionIds: [],
        },
    })

    useEffect(() => {
        async function fetchProblems() {
            try {
                const response = await fetch("/api/questions")
                const data = await response.json()
                setProblems(data)
            } catch (error) {
                console.error("Failed to fetch problems:", error)
                toast.error("Failed to load problems")
            }
        }
        fetchProblems()
    }, [])

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some((t: any) => t.tag.name.toLowerCase().includes(search.toLowerCase()))
    )

    async function onSubmit(data: ContestFormValues) {
        setLoading(true)
        try {
            const response = await fetch("/api/contests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error("Failed to create contest")

            toast.success("Contest created successfully!")
            router.push("/dashboard/contests")
            router.refresh()
        } catch (error) {
            toast.error("Failed to create contest")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
                            <Link href="/dashboard/contests">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Contests
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Contest</h1>
                    <p className="text-muted-foreground mt-2">
                        Set up a new competition for developers.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contest Details</CardTitle>
                                    <CardDescription>
                                        Provide the basic information about the contest.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contest Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Weekly Challenge #1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe what this contest is about..."
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Time</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Problems</CardTitle>
                                    <CardDescription>
                                        Choose the challenges to include in this contest.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search problems by name or tag..."
                                            className="pl-9"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <ScrollArea className="h-[300px] border rounded-md p-4">
                                        <div className="space-y-3">
                                            {filteredProblems.map((problem) => (
                                                <div
                                                    key={problem.id}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={problem.id}
                                                            checked={form.watch("questionIds").includes(problem.id)}
                                                            onCheckedChange={(checked) => {
                                                                const current = form.getValues("questionIds")
                                                                if (checked) {
                                                                    form.setValue("questionIds", [...current, problem.id])
                                                                } else {
                                                                    form.setValue("questionIds", current.filter((id) => id !== problem.id))
                                                                }
                                                            }}
                                                        />
                                                        <div className="space-y-0.5">
                                                            <label
                                                                htmlFor={problem.id}
                                                                className="text-sm font-medium leading-none cursor-pointer"
                                                            >
                                                                {problem.title}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                                    {problem.difficulty}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {problem.points} pts
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredProblems.length === 0 && (
                                                <div className="text-center py-10 text-muted-foreground">
                                                    No problems found.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage>{form.formState.errors.questionIds?.message}</FormMessage>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="sticky top-8">
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Selected Problems:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {form.watch("questionIds").length > 0 ? (
                                                form.watch("questionIds").map(id => {
                                                    const p = problems.find(prob => prob.id === id)
                                                    return p ? (
                                                        <Badge key={id} variant="secondary">
                                                            {p.title}
                                                        </Badge>
                                                    ) : null
                                                })
                                            ) : (
                                                <p className="text-xs italic text-muted-foreground">No problems selected</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Trophy className="mr-2 h-4 w-4" />
                                                Create Contest
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
