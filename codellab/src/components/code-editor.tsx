"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import Editor, { Monaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes";
import { Spinner } from "@/components/ui/spinner";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";

import {
  Play,
  Save,
  Share2,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Braces,
  FileCode2,
  Code2,
  Coffee,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CodeEditorProps {
  roomId?: string
  questionId?: string
  code?: string
  language?: string
  onCodeChange?: (code: string) => void
  onRun?: (code: string) => void
  onRunComplete?: (output: any, logs: any) => void
  onCursorMove?: (position: { lineNumber: number; column: number }) => void
  showToolbar?: boolean
  externalOutput?: any
  externalLogs?: any
  readOnly?: boolean
}

export function CodeEditor({
  roomId,
  questionId,
  code: externalCode,
  language = "javascript",
  onCodeChange,
  onRun,
  onRunComplete,
  onCursorMove,
  showToolbar = true,
  externalOutput,
  externalLogs,
  readOnly = false
}: CodeEditorProps) {
  const [code, setCode] = useState(externalCode || "")
  const [output, setOutput] = useState(externalOutput || "" as string | ReactNode)
  const [logs, setLogs] = useState("" as string | ReactNode)
  const [isRunning, setIsRunning] = useState(false)
  const [metadata, setMetadata] = useState("" as string | ReactNode)
  const [heading, setHeading] = useState("CodeLab" as string | ReactNode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const { theme } = useTheme()
  // Telemetry for cheat detection
  const eventBuffer = useRef<any[]>([])
  const lastEventTime = useRef<number>(Date.now())

  // Sync internal code with external code (remote changes)
  useEffect(() => {
    if (externalCode !== undefined && externalCode !== code) {
      setCode(externalCode)
    }
  }, [externalCode])

  useEffect(() => {
    if (externalOutput !== undefined) setOutput(externalOutput)
    if (externalLogs !== undefined) setLogs(externalLogs)
  }, [externalOutput, externalLogs])

  const languages = [
    { value: "javascript", label: "JavaScript", icon: Braces },
    { value: "typescript", label: "TypeScript", icon: FileCode2 },
    { value: "python", label: "Python", icon: Code2 },
    { value: "java", label: "Java", icon: Coffee },
    { value: "cpp", label: "C++", icon: Code2 }
  ];

  const handleEditorChange = (value: string | undefined, event?: any) => {
    if (readOnly) return;
    const newCode = value || ""
    const now = Date.now()
    const deltaLength = Math.abs(newCode.length - code.length)

    // Capture event for cheat detection
    const isPaste = deltaLength > 10 // Heuristic for paste if event data is missing
    eventBuffer.current.push({
      type: isPaste ? "PASTE" : "KEYSTROKE",
      deltaLength,
      timestamp: new Date(now).toISOString(),
      metadata: {
        interval: now - lastEventTime.current,
        totalLength: newCode.length
      }
    })
    lastEventTime.current = now

    setCode(newCode)
    onCodeChange?.(newCode)
  }

  const handleRun = async () => {
    setIsRunning(true)
    setOutput(<div className="">
      <div className="animate-pulse">
        <div className="h-6 bg-primary/10 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-primary/10 rounded w-1/2 mb-2"></div>
      </div>
    </div>)
    setLogs(<div className="rounded-lg">
      <div className="animate-pulse">
        <div className="h-6 bg-primary/10 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-primary/10 rounded w-1/2 mb-2"></div>

      </div>
    </div>)

    try {
      const response = await fetch("/api/judge/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: currentLanguage,
          questionId: questionId || "mock-question-id", // Fallback for now if not provided
          roomId,
          events: eventBuffer.current,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Check if we have an external coordinator (like useCodeCoordinator)
        const hasExternalCoordinator = !!onRunComplete;

        if (result.success === true) {
          if (!hasExternalCoordinator) {
            setOutput(<div className="bg-primary/10 p-2 rounded-md" >{result.output}</div>);
            setHeading(<span className="text-green-500">Accepted</span>)
          }
        } else {
          if (!hasExternalCoordinator) {
            setHeading(<span className="text-red-500">{result.error || "Compile Error"}</span>)
            setOutput(<div className="text-red-500 bg-red-500/10 p-2 rounded-md" >Failed to execute</div>);
          }
        }

        const logsString = Array.isArray(result.logs)
          ? result.logs.join("\n")
          : String(result.logs || "");

        const formattedLogs = <div className={` bg-primary/10 p-2 rounded-md ${result.success === true ? "" : "text-red-500 bg-red-500/10"}`} >
          {
            logsString
              .replace(/^[^\n]*:\d+\n/, "")
              .trim() || "No console output."
          }
        </div>;

        if (!hasExternalCoordinator) {
          setLogs(formattedLogs);
        }

        // Call onRunComplete if provided (will be handled by external coordinator like useCodeCoordinator)
        onRunComplete?.(
          result.success === true
            ? <div className="bg-primary/10 p-2 rounded-md" >{result.output}</div>
            : <div className="text-red-500 bg-red-500/10 p-2 rounded-md" >Failed to execute</div>,
          formattedLogs
        );

        eventBuffer.current = [];
      } else {
        // Only set output directly if there's no external coordinator
        if (!onRunComplete) {
          setOutput(`Error: ${result.error || "Failed to submit"}`);
        }
      }
    } catch (error) {
      // Only set output/logs directly if there's no external coordinator
      if (!onRunComplete) {
        setOutput(`Error: ${error}`);
        setLogs(`Error: ${error}`);
      }
    } finally {
      setIsRunning(false)
    }

    onRun?.(code)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${currentLanguage}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    // Update code template based on language
    const templates = {
      javascript: `// Welcome to CodeLab!
// Start coding here...

function solution() {
  // Your solution here
  return "Hello, World!";
}

console.log(solution());`,
      python: `# Welcome to CodeLab!
# Start coding here...

def solution():
    # Your solution here
    return "Hello, World!"

print(solution())`,
      java: `// Welcome to CodeLab!
// Start coding here...

public class Solution {
    public static String solution() {
        // Your solution here
        return "Hello, World!";
    }
    
    public static void main(String[] args) {
        System.out.println(solution());
    }
}`,
      cpp: `// Welcome to CodeLab!
// Start coding here...

#include <iostream>
#include <string>

std::string solution() {
    // Your solution here
    return "Hello, World!";
}

int main() {
    std::cout << solution() << std::endl;
    return 0;
}`,
      typescript: `// Welcome to CodeLab!
// Start coding here...

function solution(): string {
  // Your solution here
  return "Hello, World!";
}

console.log(solution());`
    }
    setCode(templates[newLanguage as keyof typeof templates])
  }

  const handleBeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("leetcode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#171717",
        "editor.lineHighlightBackground": "#ffffff0d",
        "editor.selectionBackground": "#ffffff1f",
        "editorCursor.foreground": "#ffffff",
      },
    });

    monaco.editor.defineTheme("leetcode-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#00000000",
        "editor.lineHighlightBackground": "#0000000a",
        "editor.selectionBackground": "#0000001a",
        "editorCursor.foreground": "#000000",
      },
    });
  };

  return (
    <div
      className={`flex flex-col gap-2 ${isFullscreen
        ? 'fixed inset-0 z-50 h-screen overflow-hidden bg-background'
        : 'h-full'
        }`}
    >

      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Code Editor</CardTitle>
            {roomId && (
              <Badge variant="outline" className="text-xs">
                Room: {roomId}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleRun}
                disabled={isRunning}
                className="gap-2 "

              >
                {isRunning ? <Spinner className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? "Running..." : "Run Code"}
              </Button>
            </div>
            <ButtonGroup>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[160px] justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const current = languages.find(
                          (l) => l.value === currentLanguage
                        );
                        const Icon = current?.icon;
                        return (
                          <>
                            {Icon && <Icon className="h-4 w-4" />}
                            {current?.label}
                          </>
                        );
                      })()
                      }
                    </span>

                    {/* Select dropdown indicator */}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="min-w-[160px]">
                  {languages.map((lang) => {
                    const Icon = lang.icon;
                    return (
                      <DropdownMenuItem
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{lang.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy code"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                title="Download code"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

            </ButtonGroup>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-0">
          <div className="h-full bg-background  rounded-md">
            <Editor
              height="100%"
              language={currentLanguage}
              value={code}
              onChange={handleEditorChange}
              beforeMount={handleBeforeMount}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition((e) => {
                  onCursorMove?.(e.position)
                })
              }}
              theme={theme === "dark" ? "leetcode-dark" : "leetcode-light"}
              options={{
                readOnly: readOnly,
                minimap: { enabled: false },

                fontFamily: `"JetBrains Mono", Menlo, Consolas, monospace`,
                fontSize: 14,
                lineHeight: 22,
                fontLigatures: false,

                cursorStyle: "line",
                renderLineHighlight: "line",

                scrollBeyondLastLine: false,
                automaticLayout: true,

                padding: {
                  top: 12,
                  bottom: 12,
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col min-h-0 overflow-hidden">

        {showToolbar && (
          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
            <Tabs defaultValue="output" className="w-full h-full flex flex-col min-h-0">

              <TabsList className="grid w-full grid-cols-2 max-w-[200px]" />

              <TabsContent value="output" className="flex-1 overflow-auto min-h-0">
                <div className="p-4 font-mono text-sm">
                  <h1 className="text-2xl font-semibold">{heading}</h1>
                  {metadata}
                  <div className="mt-4">{output}</div>
                </div>
              </TabsContent>

              <TabsContent value="console" className="flex-1 overflow-auto min-h-0">
                <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                  <h1 className="text-2xl font-semibold">{heading}</h1>
                  <div className="mt-4">{logs}</div>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        )}

      </Card>

    </div>
  )
}