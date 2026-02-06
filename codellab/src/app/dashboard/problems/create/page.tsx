'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Plus, Trash2, Save, FileJson, Copy, Check, Zap } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

// ────────────────────────────────────────────────
// Zod Schema
// ────────────────────────────────────────────────
const problemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  points: z.coerce.number().min(0).default(100),
  timeLimit: z.coerce.number().min(100).default(1000),
  memoryLimit: z.coerce.number().min(64).default(256),
  functionName: z
    .string()
    .min(1, "Function name is required")
    .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, "Must be a valid identifier"),
  inputs: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Input name is required")
          .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, "Must be a valid identifier"),
        type: z.enum([
          "INT",
          "FLOAT",
          "STRING",
          "BOOLEAN",
          "INT_ARRAY",
          "FLOAT_ARRAY",
          "STRING_ARRAY",
          "BOOLEAN_ARRAY",
          "INT_MATRIX",
          "STRING_MATRIX",
        ]),
        description: z.string().optional(),
        order: z.number().int().nonnegative(),
      })
    )
    .min(0)
    .max(10, "Maximum 10 inputs allowed"),
  output: z
    .object({
      type: z.enum([
        "INT",
        "FLOAT",
        "STRING",
        "BOOLEAN",
        "INT_ARRAY",
        "FLOAT_ARRAY",
        "STRING_ARRAY",
        "BOOLEAN_ARRAY",
        "INT_MATRIX",
        "STRING_MATRIX",
      ]),
      description: z.string().optional(),
    })
    .optional(),
  testCases: z
    .array(
      z.object({
        inputs: z.record(z.string(), z.any()),
        expected_output: z.any(),
        visibility: z.enum(["PUBLIC", "HIDDEN"]).default("PUBLIC"),
      })
    )
    .min(1, "At least one test case is required"),
})

type ProblemFormValues = z.infer<typeof problemSchema>

const AI_PROMPT = `Generate a coding problem in the following JSON format. Ensure the description is detailed and uses HTML for formatting.

\`\`\`json
{
  "title": "Problem Title",
  "slug": "problem-slug",
  "description": "<h1>Problem Description</h1><p>Detailed explanation...</p>",
  "difficulty": "EASY",
  "points": 100,
  "timeLimit": 1000,
  "memoryLimit": 256,
  "functionName": "solve",
  "inputs": [
    { "name": "nums", "type": "INT_ARRAY", "description": "array of integers", "order": 0 }
  ],
  "output": { "type": "INT", "description": "result integer" },
  "testCases": [
    { "inputs": { "nums": [1, 2, 3] }, "expected_output": 6, "visibility": "PUBLIC" }
  ]
}
\`\`\`

Available types: INT, FLOAT, STRING, BOOLEAN, INT_ARRAY, FLOAT_ARRAY, STRING_ARRAY, BOOLEAN_ARRAY, INT_MATRIX, STRING_MATRIX.
Difficulty: EASY, MEDIUM, HARD.
Visibility: PUBLIC, HIDDEN.`;

// ────────────────────────────────────────────────
// Helper Component for Structured Inputs
// ────────────────────────────────────────────────
const TestCaseInput = ({
  type,
  value,
  onChange,
}: {
  type: string
  value: any
  onChange: (val: any) => void
}) => {
  const getDefault = (t: string) => {
    if (t === "INT" || t === "FLOAT") return 0
    if (t === "BOOLEAN") return false
    if (t === "STRING") return ""
    return [] // for arrays/matrices
  }

  // Handle Primitives
  if (type === "INT") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
           const val = e.target.value;
           onChange(val === "" ? undefined : parseInt(val));
        }}
        placeholder="Integer"
      />
    )
  }
  if (type === "FLOAT") {
    return (
      <Input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => {
           const val = e.target.value;
           onChange(val === "" ? undefined : parseFloat(val));
        }}
        placeholder="Float"
      />
    )
  }
  if (type === "STRING") {
    return (
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="String"
      />
    )
  }
  if (type === "BOOLEAN") {
    return (
      <Select
        value={value === undefined ? undefined : String(value)}
        onValueChange={(v) => onChange(v === "true")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Boolean" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  // Handle Arrays
  if (type.endsWith("_ARRAY")) {
    const baseType = type.replace("_ARRAY", "")
    const arr = Array.isArray(value) ? value : []

    return (
      <div className="space-y-2 pl-2 border-l-2 border-muted">
        {arr.map((item: any, i: number) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground w-6 text-right">{i}:</span>
            <div className="flex-1">
              <TestCaseInput
                type={baseType}
                value={item}
                onChange={(v) => {
                  const newArr = [...arr]
                  newArr[i] = v
                  onChange(newArr)
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onChange(arr.filter((_: any, idx: number) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...arr, getDefault(baseType)])}
          className="ml-8"
        >
          <Plus className="mr-2 h-3 w-3" /> Add Item
        </Button>
      </div>
    )
  }

  // Handle Matrices (List of Arrays)
  if (type.endsWith("_MATRIX")) {
    const baseArrayType = type.replace("_MATRIX", "_ARRAY")
    const matrix = Array.isArray(value) ? value : []

    return (
      <div className="space-y-4 pl-2 border-l-2 border-muted">
        {matrix.map((row: any, i: number) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Row {i}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onChange(matrix.filter((_: any, idx: number) => idx !== i))}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TestCaseInput
              type={baseArrayType}
              value={row}
              onChange={(v) => {
                const newMatrix = [...matrix]
                newMatrix[i] = v
                onChange(newMatrix)
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...matrix, []])}
        >
          <Plus className="mr-2 h-3 w-3" /> Add Row
        </Button>
      </div>
    )
  }

  return <div className="text-red-500">Unknown Type: {type}</div>
}

export default function CreateProblemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rawJson, setRawJson] = useState("")
  const [copied, setCopied] = useState(false)

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemSchema) as any,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      difficulty: "MEDIUM",
      points: 100,
      timeLimit: 1000,
      memoryLimit: 256,
      functionName: "solve",
      inputs: [],
      output: undefined,
      testCases: [{ inputs: {}, expected_output: null, visibility: "PUBLIC" }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testCases",
  })

  // Preserve test case data when input names change
  const migrateTestCases = (oldName: string, newName: string) => {
    const cases = form.getValues("testCases") || []
    cases.forEach(tc => {
      if (tc.inputs?.[oldName] !== undefined) {
        tc.inputs[newName] = tc.inputs[oldName]
        delete tc.inputs[oldName]
      }
    })
    form.setValue("testCases", cases)
  }

  // Effect to update test cases when inputs change
  const inputs = form.watch("inputs")
  React.useEffect(() => {
    const testCases = form.getValues("testCases") || []
    testCases.forEach((testCase, tcIndex) => {
      const newInputs = { ...testCase.inputs }
      // Add new input fields
      inputs?.forEach(input => {
        if (!(input.name in newInputs)) {
          newInputs[input.name] = ""
        }
      })
      // Remove deleted input fields
      Object.keys(newInputs).forEach(key => {
        if (!inputs?.some(input => input.name === key)) {
          delete newInputs[key]
        }
      })
      form.setValue(`testCases.${tcIndex}.inputs`, newInputs)
    })
  }, [inputs, form])

  async function onSubmit(data: ProblemFormValues) {
    setLoading(true)
    try {
      // Reorder test case inputs to match input definition order
      // This ensures the judge receives arguments in the correct order
      const orderedTestCases = data.testCases.map(tc => {
        const orderedInputs: Record<string, any> = {};
        data.inputs.forEach(inputDef => {
          if (tc.inputs[inputDef.name] !== undefined) {
            orderedInputs[inputDef.name] = tc.inputs[inputDef.name];
          }
        });
        return { ...tc, inputs: orderedInputs };
      });
      data.testCases = orderedTestCases;

      // Validate that test case inputs match the defined input types
      for (const testCase of data.testCases) {
        for (const inputDef of data.inputs) {
          if (testCase.inputs[inputDef.name] !== undefined) {
            const inputValue = testCase.inputs[inputDef.name];
            const isValid = validateInputType(inputValue, inputDef.type);
            if (!isValid) {
              throw new Error(`Test case input '${inputDef.name}' does not match the defined type '${inputDef.type}'`);
            }
          }
        }
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create problem")
      }

      toast.success("Problem created successfully!")
      router.push("/dashboard/problems/all")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create problem")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to validate input types
  function validateInputType(value: any, type: string): boolean {
    try {
      // If the value is a string representation of JSON, parse it
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // If parsing fails, keep the original string value
        }
      }

      switch (type) {
        case "INT":
          return Number.isInteger(value);
        case "FLOAT":
          return typeof value === "number" && !Number.isNaN(value);
        case "STRING":
          return typeof value === "string";
        case "BOOLEAN":
          return typeof value === "boolean";
        case "INT_ARRAY":
          return Array.isArray(value) && value.every(item => Number.isInteger(item));
        case "FLOAT_ARRAY":
          return Array.isArray(value) && value.every(item => typeof item === "number" && !Number.isNaN(item));
        case "STRING_ARRAY":
          return Array.isArray(value) && value.every(item => typeof item === "string");
        case "BOOLEAN_ARRAY":
          return Array.isArray(value) && value.every(item => typeof item === "boolean");
        case "INT_MATRIX":
          return Array.isArray(value) && value.every(row =>
            Array.isArray(row) && row.every(item => Number.isInteger(item))
          );
        case "STRING_MATRIX":
          return Array.isArray(value) && value.every(row =>
            Array.isArray(row) && row.every(item => typeof item === "string")
          );
        default:
          return true; // Allow other types by default
      }
    } catch {
      return false; // If validation throws an error, return false
    }
  }

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    form.setValue("title", title, { shouldValidate: true })

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    form.setValue("slug", slug, { shouldValidate: true })
  }

  const handleImportJson = () => {
    try {
      if (!rawJson.trim()) return;
      const parsed = JSON.parse(rawJson)
      
      const defaultValues: ProblemFormValues = {
        title: "",
        slug: "",
        description: "",
        difficulty: "MEDIUM",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 256,
        functionName: "solve",
        inputs: [],
        output: { type: "INT", description: "" },
        testCases: [{ inputs: {}, expected_output: null, visibility: "PUBLIC" }],
      }

      // Merge parsed data with defaults
      const merged = { ...defaultValues, ...parsed }
      
      // Ensure testCases exist and have at least one entry
      if (!merged.testCases || !Array.isArray(merged.testCases) || merged.testCases.length === 0) {
        merged.testCases = defaultValues.testCases;
      }

      form.reset(merged)
      toast.success("JSON applied to form successfully!")
      setRawJson("")
    } catch (error: any) {
      toast.error("Invalid JSON: " + error.message)
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT)
    setCopied(true)
    toast.success("AI Prompt copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
              <Link href="/dashboard/problems/all">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Problems
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Problem</h1>
          <p className="text-muted-foreground mt-2">Add a new coding challenge to the platform.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* AI Import Section */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Quick Import (AI)</CardTitle>
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={copyPrompt}
                      className="h-8 gap-2"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy AI Prompt
                    </Button>
                  </div>
                  <CardDescription>
                    Paste raw JSON generated by an AI to quickly populate the form.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder='Paste JSON here... e.g. { "title": "Two Sum", ... }'
                    className="font-mono text-xs min-h-[120px] bg-background"
                    value={rawJson}
                    onChange={(e) => setRawJson(e.target.value)}
                  />
                  <Button 
                    type="button"
                    className="w-full gap-2" 
                    onClick={handleImportJson}
                    disabled={!rawJson.trim()}
                  >
                    <Zap className="h-4 w-4" />
                    Apply JSON to Form
                  </Button>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>The core details of the coding challenge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Two Sum" {...field} onChange={handleTitleChange} />
                        </FormControl>
                        <FormDescription>A concise and descriptive title.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. two-sum" {...field} />
                        </FormControl>
                        <FormDescription>The URL-friendly identifier.</FormDescription>
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
                          <RichTextEditor
                            placeholder="Detailed problem statement..."
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>Use the toolbar to format the problem description.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="functionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Function Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. solve" {...field} />
                        </FormControl>
                        <FormDescription>The name of the function users will implement.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Input Definitions */}
              <Card>
                <CardHeader>
                  <CardTitle>Input Definitions</CardTitle>
                  <CardDescription>Define the inputs for the function.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = form.getValues("inputs") || []
                        if (current.length >= 10) {
                          toast.error("Maximum 10 inputs allowed")
                          return
                        }
                        form.setValue("inputs", [
                          ...current,
                          {
                            name: "",
                            type: "INT",
                            description: "",
                            order: current.length,
                          },
                        ])
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Input
                    </Button>
                  </div>

                  {form.watch("inputs")?.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`inputs.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Input Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="variable name"
                                  {...field}
                                  onChange={(e) => {
                                    const newName = e.target.value
                                    if (field.value && field.value !== newName) {
                                      migrateTestCases(field.value, newName)
                                    }
                                    field.onChange(e)
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`inputs.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="INT">int</SelectItem>
                                  <SelectItem value="FLOAT">float</SelectItem>
                                  <SelectItem value="STRING">string</SelectItem>
                                  <SelectItem value="BOOLEAN">boolean</SelectItem>
                                  <SelectItem value="INT_ARRAY">int[]</SelectItem>
                                  <SelectItem value="FLOAT_ARRAY">float[]</SelectItem>
                                  <SelectItem value="STRING_ARRAY">string[]</SelectItem>
                                  <SelectItem value="BOOLEAN_ARRAY">boolean[]</SelectItem>
                                  <SelectItem value="INT_MATRIX">int[][]</SelectItem>
                                  <SelectItem value="STRING_MATRIX">string[][]</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`inputs.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl>
                                <Input placeholder="short description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            const current = form.getValues("inputs") || []
                            const removedInput = current[index]
                            const updated = current.filter((_, i) => i !== index)
                            updated.forEach((item, i) => {
                              item.order = i
                            })
                            form.setValue("inputs", updated)

                            // Remove the corresponding input from all test cases
                            const testCases = form.getValues("testCases") || []
                            testCases.forEach((testCase, tcIndex) => {
                              if (testCase.inputs && removedInput) {
                                const newInputs = { ...testCase.inputs }
                                delete newInputs[removedInput.name]
                                form.setValue(`testCases.${tcIndex}.inputs`, newInputs)
                              }
                            })
                            form.setValue("testCases", testCases)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(form.watch("inputs")?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No inputs defined. Add at least one input (recommended).
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Output Definition */}
              <Card>
                <CardHeader>
                  <CardTitle>Output Definition</CardTitle>
                  <CardDescription>Define what the function should return.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="output.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select output type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INT">int</SelectItem>
                            <SelectItem value="FLOAT">float</SelectItem>
                            <SelectItem value="STRING">string</SelectItem>
                            <SelectItem value="BOOLEAN">boolean</SelectItem>
                            <SelectItem value="INT_ARRAY">int[]</SelectItem>
                            <SelectItem value="FLOAT_ARRAY">float[]</SelectItem>
                            <SelectItem value="STRING_ARRAY">string[]</SelectItem>
                            <SelectItem value="BOOLEAN_ARRAY">boolean[]</SelectItem>
                            <SelectItem value="INT_MATRIX">int[][]</SelectItem>
                            <SelectItem value="STRING_MATRIX">string[][]</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="output.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Output Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Explanation of what the function must return"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Test Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Cases</CardTitle>
                      <CardDescription>
                        Define test cases with structured inputs and expected outputs.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          inputs: {},
                          expected_output: null,
                          visibility: "PUBLIC",
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Case
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative p-4 border rounded-lg bg-muted/20">
                      <div className="absolute right-2 top-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Dynamic input fields */}
                      {form.watch("inputs")?.map((inputDef, i) => (
                        <div key={i} className="mb-4">
                          <FormField
                            control={form.control}
                            name={`testCases.${index}.inputs.${inputDef.name}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  {inputDef.name}{" "}
                                  <span className="text-muted-foreground">({inputDef.type})</span>
                                </FormLabel>
                                <FormControl>
                                  <TestCaseInput
                                    type={inputDef.type}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      {/* Expected Output */}
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name={`testCases.${index}.expected_output`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Expected Output
                                {form.watch("output.type") && (
                                  <span className="text-muted-foreground ml-2">
                                    ({form.watch("output.type")})
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                {form.watch("output.type") ? (
                                  <TestCaseInput
                                    type={form.watch("output.type") as string}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                ) : (
                                  <div className="p-4 border border-dashed rounded text-sm text-center text-muted-foreground">
                                    Please select an Output Type in the configuration above to define expected
                                    outputs.
                                  </div>
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Visibility */}
                      <FormField
                        control={form.control}
                        name={`testCases.${index}.visibility`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="Visibility" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PUBLIC">Public</SelectItem>
                                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Visibility</FormLabel>
                              <FormDescription>Who can see this test case?</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No test cases added. At least one is required.
                    </p>
                  )}

                  <FormMessage>{form.formState.errors.testCases?.root?.message}</FormMessage>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Adjust difficulty and limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EASY">Easy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HARD">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (ms)</FormLabel>
                        <FormControl>
                          <Input type="number" min={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="memoryLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Memory Limit (MB)</FormLabel>
                        <FormControl>
                          <Input type="number" min={64} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Problem
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