"use client"
import React from 'react';
import {
  Code2,
  Users,
  Trophy,
  Shield,
  Zap,
  BarChart3,
  GitBranch,
  Play,
  ArrowRight,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from "framer-motion";

// --- Mock Data for Analytics ---
const chartData = [
  { month: 'Jan', active: 4000, commits: 2400 },
  { month: 'Feb', active: 5200, commits: 3200 },
  { month: 'Mar', active: 4800, commits: 4100 },
  { month: 'Apr', active: 6100, commits: 4800 },
  { month: 'May', active: 7500, commits: 5900 },
  { month: 'Jun', active: 8900, commits: 7200 },
  { month: 'Jul', active: 10500, commits: 8800 },
];

const features = [
  {
    icon: Code2,
    title: "Collaborative Editor",
    description: "Real-time code editing with live cursors and instant synchronization.",
    badges: ["Monaco", "Sync"],
    size: "large",
  },
  {
    icon: Users,
    title: "Team Rooms",
    description: "Private coding rooms with role-based permissions.",
    badges: ["RBAC"],
    size: "small",
  },
  {
    icon: Trophy,
    title: "Contests",
    description: "Competitive programming with real-time leaderboards.",
    badges: ["Judging"],
    size: "small",
  },
  {
    icon: Shield,
    title: "Cheat Detection",
    description: "Advanced algorithms detect suspicious behavior and code similarity.",
    badges: ["Security"],
    size: "medium",
  },
  {
    icon: Play,
    title: "Code Execution",
    description: "Run code in secure, isolated containers across 20+ languages.",
    badges: ["Docker"],
    size: "large",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with sub-second WebSocket synchronization.",
    badges: ["Latency"],
    size: "small",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track progress with detailed metrics and submission history.",
    badges: ["Stats"],
    size: "medium",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Automatic versioning with diff viewing and rollback.",
    badges: ["Git"],
    size: "small",
  },
];

// --- Sub-Components ---

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const isLarge = feature.size === 'large';
  const isMedium = feature.size === 'medium';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-zinc-500/5 dark:hover:shadow-zinc-900/20 ${isLarge ? 'md:col-span-2 md:row-span-2' : isMedium ? 'md:col-span-2' : 'col-span-1'
      }`}
    >
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 group-hover:scale-110 transition-transform">
            <feature.icon size={20} />
          </div>
          <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {feature.badges.map((badge) => (
            <span key={badge} className="inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
        <feature.icon size={120} />
      </div>
    </motion.div>
  );
};

// --- Main Component ---

export default function ProjectFeatures() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-zinc-900 selection:text-zinc-50 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      <section className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
        {/* Background Patterns */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <svg className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-zinc-200 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)] dark:stroke-zinc-800" aria-hidden="true">
            <defs>
              <pattern id="grid" width="40" height="40" x="50%" y="-1" patternUnits="userSpaceOnUse">
                <path d="M.5 40V.5H40" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid)" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-16 md:mb-24">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl mb-6">
              Engineered for <span className="text-zinc-500 italic">high-performance</span> collaboration.
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <p className="max-w-2xl text-lg text-muted-foreground">
                We've consolidated the world's most powerful coding tools into a single, cohesive environment.
                No context switching. Just code.
              </p>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
export { ProjectFeatures }
