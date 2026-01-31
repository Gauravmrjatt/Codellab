import type { Metadata } from "next";
import { LandingNavigation } from "@/components/landing-navigation";
import { Footer } from "@/components/footer";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CodeLab - Collaborative Coding Platform",
  description: "Practice coding together in real-time. Compete in contests, solve problems, and learn collaboratively.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}