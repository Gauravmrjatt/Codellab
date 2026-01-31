import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { CheatLogViewer } from "@/components/CheatLogViewer";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Administrative tools and monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Cheat Detection</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor suspicious activities in coding sessions
            </p>
          </CardHeader>
          <CardContent>
            <CheatLogViewer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}