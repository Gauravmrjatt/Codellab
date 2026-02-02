import type { Metadata } from "next";
import { Geist, Geist_Mono , JetBrains_Mono} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import '@excalidraw/excalidraw/index.css';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "CodeLab - Collaborative Coding Platform",
  description: "Practice coding together in real-time. Compete in contests, solve problems, and learn collaboratively.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
  className={`${geistSans.variable} ${geistMono.variable} ${jetbrains.variable} antialiased`}
>

        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
