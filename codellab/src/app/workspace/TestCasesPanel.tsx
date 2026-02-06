import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { useCodeEditorStore } from "@/stores/code-editor-store";

import { FaCircleCheck, FaClock } from "react-icons/fa6";
import { GoXCircleFill } from "react-icons/go";

interface TestCase {
  id: string;
  input: any[];     // API shape: array of values
  expectedOutput: any;
  actualOutput?: any;
  isPublic: boolean;
}

interface InputDefinition {
  id: string;
  name: string;
  type: string;
  order: number;
}

interface TestCasesPanelProps {
  roomId: string;
  questionId: string;
  testCases?: TestCase[];
}

export function TestCasesPanel({
  roomId,
  questionId,
  testCases: propTestCases,
}: TestCasesPanelProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [inputs, setInputs] = useState<InputDefinition[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { testCaseResults } = useCodeEditorStore();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch Question to get input definitions
        const qRes = await fetch(`/api/questions/${questionId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          setInputs(qData.inputs || []);
        }

        if (propTestCases && propTestCases.length > 0) {
          setTestCases(propTestCases);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/questions/${questionId}/testcases`);
        if (!res.ok) throw new Error("Failed to load testcases");

        const data = await res.json();
        setTestCases(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [questionId, propTestCases]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Loading testcases…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  /**
   * 🔑 CRITICAL FIX
   * If no testcase is public, show all
   */
  const publicCases = testCases.some(tc => tc.isPublic)
    ? testCases.filter(tc => tc.isPublic)
    : testCases;

  if (publicCases.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No testcases available
      </div>
    );
  }

  const activeTestCase = publicCases[activeIndex];
  const activeResult = testCaseResults?.[activeIndex];

  /**
   * Format input object → readable text
   */
  const formatInput = (input: any[]) => {
    if (!input || !Array.isArray(input)) return [];

    return input.map((value, idx) => {
      const def = inputs.find(i => i.order === idx);
      const name = def ? def.name : `Input ${idx + 1}`;
      return {
        name,
        value: JSON.stringify(value)
      };
    });
  };

  const formattedInputs = formatInput(activeTestCase.input);

  return (
    <div className="h-full flex flex-col bg-(--group-color) overflow-scroll">
      {/* Result Status */}
      {activeResult && (
        <div className="px-4 py-2 text-sm flex items-center gap-2">
          {activeResult.passed ? (
            <>
              <FaCircleCheck className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-bold">Accepted</span>
            </>
          ) : (
            <>
              <GoXCircleFill className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-bold">Wrong Answer</span>
            </>
          )}

          <Separator orientation="vertical" className="h-4 mx-2" />

          <FaClock className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-blue-400 font-bold">
            {activeResult.runtime} ms
          </span>
        </div>
      )}

      <Separator />
      {/* Content */}
      <div className="">
        {/* Case Selector */}
        <div className="px-4 py-2 flex gap-2 border-b  overflow-x-auto">
          {publicCases.map((_, idx) => {
            const result = testCaseResults?.[idx];
            const active = idx === activeIndex;

            return (
              <Button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                variant="ghost"
                size="lg"
                className={`
                px-3 py-1 text-xs rounded-xl flex gap-2 items-center transition
                ${active
                    ? "bg-muted border border-primary/10 text-primary"
                    : "text-primary/70 hover:bg-muted"}
              `}
              >
                {result &&
                  (result.passed ? (
                    <FaCircleCheck className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <GoXCircleFill className="h-3.5 w-3.5 text-red-400" />
                  ))}
                Case {idx + 1}
              </Button>
            );
          })}
        </div>

        <div className="space-y-4  p-5  text-sm font-mono">
          {/* Input */}
          <div className="space-y-2">
            {formattedInputs.map((item, idx) => (
              <div key={idx}>
                <p className="text-xs text-muted-foreground mt-3">
                  {item.name}
                </p>
                <pre className="bg-muted p-3 rounded-md mt-1">
                  {item.value}
                </pre>
              </div>
            ))}
            {formattedInputs.length === 0 && (
              <pre className="bg-muted p-3 rounded-md">
                —
              </pre>
            )}
          </div>

          {/* Expected Output */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Expected Output
            </p>
            <pre className="bg-muted p-3 rounded-md">
              {JSON.stringify(activeTestCase.expectedOutput)}
            </pre>
          </div>

          {/* Your Output */}
          {activeResult && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Your Output
              </p>
              <pre
                className={`p-3 rounded-md ${activeResult.passed
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
                  }`}
              >
                {activeResult.actualOutput ? (
                  <>
                    {JSON.stringify(activeResult.actualOutput)}
                  </>
                ) : (
                  activeResult.logs?.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))
                )}

              </pre>

              {activeResult.error && (
                <div>
                  <p className="text-xs text-destructive mt-2">
                    {activeResult.error}
                  </p>


                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
