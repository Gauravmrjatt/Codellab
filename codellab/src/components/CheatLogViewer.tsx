"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";

// Define the CheatLog type
type CheatLog = {
  id: string;
  userId: string;
  user?: {
    username: string;
  };
  submissionId: string | null;
  submission?: {
    id: string;
  };
  type: string;
  severity: number;
  metadata: any;
  createdAt: string;
};

export function CheatLogViewer() {
  const [cheatLogs, setCheatLogs] = useState<CheatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const { data: session, status } = useSession();
  const currentUserRole = session?.user?.role || "USER";

  useEffect(() => {
    if (status === "authenticated" && currentUserRole === "ADMIN") {
      fetchCheatLogs();
    }
  }, [status, currentUserRole]);

  const fetchCheatLogs = async () => {
    try {
      const res = await fetch('/api/admin/cheat-logs');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setCheatLogs(data.cheatLogs);
    } catch (error) {
      console.error("Error fetching cheat logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "destructive";
    if (severity >= 6) return "default";
    return "secondary";
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INSTANT_PASTE":
        return "Large Paste Detected";
      case "VELOCITY":
        return "Suspicious Typing Speed";
      case "MULTIPLE_PASTE":
        return "Multiple Pastes";
      case "RAPID_PASTE":
        return "Rapid Pasting";
      case "LOW_ACTIVITY_HIGH_OUTPUT":
        return "Low Activity, High Output";
      default:
        return type;
    }
  };

  if (status === "loading") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cheat Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (currentUserRole !== "ADMIN") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cheat Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You don't have permission to view cheat logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle>Cheat Detection Logs</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Suspicious activities detected during coding sessions
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading cheat logs...</p>
          </div>
        ) : cheatLogs.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p>No suspicious activities detected.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {cheatLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={getSeverityColor(log.severity)}>
                        Severity: {log.severity}/10
                      </Badge>
                      <h3 className="font-semibold mt-2">{getTypeLabel(log.type)}</h3>
                      <p className="text-sm text-muted-foreground">
                        User: {log.user?.username || log.userId} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDetails(log.id)}
                    >
                      {showDetails[log.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {showDetails[log.id] && (
                    <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}