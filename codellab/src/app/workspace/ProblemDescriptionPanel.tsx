import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Send, FileText, Beaker, List, History, Lock } from "lucide-react";
import { useCodeCoordinator } from "@/hooks/useCodeCoordinator";
import { useCodeEditorStore } from "@/stores/code-editor-store";

interface ProblemDescriptionPanelProps {
  roomId: string;
  questionId: string;
}

export function ProblemDescriptionPanel({ roomId, questionId }: ProblemDescriptionPanelProps) {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCode } = useCodeEditorStore();
  const { handleRun, handleSubmitSolution } = useCodeCoordinator({ roomId, questionId });

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`/api/questions/${questionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch question");
        }
        const data = await response.json();
        setQuestion(data);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchQuestion();
    } else {
      setQuestion({
        title: "No Problem Selected",
        difficulty: "N/A",
        points: 0,
        description: "<p>No problem has been selected for this workspace. You can code freely without a specific problem to solve.</p>",
        constraints: "",
        examples: []
      });
      setLoading(false);
    }
  }, [questionId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive font-medium">Error: {error || "Question not found"}</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY": return "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20";
      case "MEDIUM": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20";
      case "HARD": return "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="h-full w-full">
        <div className="p-6 max-w-4xl mx-auto pb-20">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-3">{question.title}</h1>
            <div className="flex items-center gap-3">
              <Badge className={`${getDifficultyColor(question.difficulty)} border font-medium px-2.5 py-0.5 rounded-full`}>
                {question.difficulty}
              </Badge>
              {/* <span className="text-muted-foreground text-sm flex items-center gap-1">
                     <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                     {question.points} Points
                  </span> */}
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: question.description }} />
          </div>

          {question.examples && question.examples.length > 0 && (
            <div className="mt-8 space-y-6">
              {question.examples.map((example: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-semibold text-base">Example {idx + 1}:</h3>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3 font-mono text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[4rem] text-muted-foreground">Input:</span>
                      <span className="text-foreground">{example.input}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[4rem] text-muted-foreground">Output:</span>
                      <span className="text-foreground">{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="flex gap-2">
                        <span className="font-semibold min-w-[4rem] text-muted-foreground">Explain:</span>
                        <span className="text-muted-foreground">{example.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.constraints && (
            <div className="mt-8">
              <h3 className="font-semibold text-base mb-3">Constraints:</h3>
              <div
                className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground pl-4 border-l-2 border-muted"
                dangerouslySetInnerHTML={{ __html: question.constraints }}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}