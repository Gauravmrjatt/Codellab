'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Code2, Users, Trophy, Shield, Zap,
  Terminal, Globe, Cpu, Layers, GitBranch, MessageSquare,
  CheckCircle, Star, Github, Slack, Figma, Trello,
  Briefcase, GraduationCap
} from 'lucide-react';
import {
  PencilRuler,
  StickyNote,
  Video,
  Mic,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import PixelBlast from '@/components/PixelBlast';
import { LaserFlow } from '@/components/LaserFlow';
import ParallaxSection from '@/components/ParallaxSection';
import InteractiveTerminal from '@/components/InteractiveTerminal';
import RotatingText from '@/components/RotatingText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// --- COMPONENTS ---
const stats = [
  { label: "Whiteboard", val: "< 30ms", icon: PencilRuler },
  { label: "Notes", val: "24 Regions", icon: StickyNote },
  { label: "Chats", val: "99.99%", icon: MessageSquare },
  { label: "Video Call", val: "50k+", icon: Video },
  { label: "Audio Call", val: "50k+", icon: Mic },
  { label: "Questions", val: "50k+", icon: HelpCircle },
  { label: "Contests", val: "50k+", icon: Trophy },
  { label: "Leaderboard", val: "50k+", icon: BarChart3 },
];

const SectionHeader = ({ title, subtitle, align = 'center' }: { title: string, subtitle?: string, align?: 'center' | 'left' }) => (
  <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any, title: string, description: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="h-full"
  >
    <Card className="h-full bg-white/5 border-white/10 hover:border-[#edae00]/50 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#edae00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-muted/70 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-[#edae00]">
          <Icon size={24} />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-gray-400 leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  </motion.div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center space-y-4 z-5 bg-transparent">
    <div className="w-16 h-16 rounded-full bg-[#edae00]/10 border border-[#edae00]/20 flex items-center justify-center text-2xl font-bold text-[#edae00]">
      {number}
    </div>
    <h3 className="text-xl bg-background font-bold pt-0 p-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const PricingCard = ({ title, price, features, recommended = false }: { title: string, price: string, features: string[], recommended?: boolean }) => (
  <Card className={`relative flex flex-col h-full ${recommended ? 'border-[#edae00] bg-[#edae00]/5' : 'border-white/10 bg-white/5'}`}>
    {recommended && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#edae00] text-black text-xs font-bold rounded-full">
        MOST POPULAR
      </div>
    )}
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">{title}</CardTitle>
      <div className="mt-4">
        <span className="text-4xl font-bold">{price}</span>
        {price !== 'Free' && <span className="text-muted-foreground">/mo</span>}
      </div>
    </CardHeader>
    <CardContent className="flex-1">
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <CheckCircle className={`w-4 h-4 ${recommended ? 'text-[#edae00]' : 'text-gray-500'}`} />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button className={`w-full ${recommended ? 'bg-[#edae00] text-black hover:bg-[#d49b00]' : 'bg-white/10 hover:bg-white/20'}`}>
        Get Started
      </Button>
    </CardFooter>
  </Card>
);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="relative  min-h-screen overflow-x-hidden selection:bg-[#edae00] selection:text-black font-sans">

      {/* --- HERO SECTION --- */}
      <section className="relative  flex items-center justify-center pt-20 lg:pt-0 min-h-dvh">
        <div className="absolute inset-0 z-0">
          {/* <PixelBlast 
            pixelSize={30} 
            color="#edae00" 
            variant="square" 
            patternDensity={0.3} 
            speed={0.2}
            className="opacity-20"
          /> */}
        </div>

        <div className="absolute inset-0  z-0 pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container relative z-10 px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 border border-[#edae00]/30 bg-[#edae00]/5 px-3 py-1 rounded-full text-xs font-medium text-[#edae00] mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#edae00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#edae00]"></span>
                </span>
                v2.0 is Live
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 relative overflow-hidden">
                Code Together.<br />
                <RotatingText
                  texts={['Build Faster.', 'Ship Better.', 'Scale Up.']}
                  mainClassName="text-[#edae00]"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  transition={{ type: "spring", damping: 20 }}
                  rotationInterval={3000}
                />
              </h1>
              <p className="text-xl text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                The ultimate collaborative workspace for engineering teams. Real-time editing, secure sandboxes, and integrated communication.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg bg-[#edae00] hover:bg-[#d49b00] text-black font-bold rounded-full w-full sm:w-auto shadow-[0_0_20px_rgba(237,174,0,0.3)]">
                  Start Coding Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contest">
                <Button size="lg" variant="ghost" className="h-14 px-8 text-lg border border-white/10 hover:bg-white/5 hover:text-white rounded-full w-full sm:w-auto">
                  Explore Contests
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500"
            >
              {/* <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-black bg-gray-800">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div> */}
              {/* <div className="flex flex-col">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-[#edae00] fill-[#edae00]" />)}
                </div>
                <span>Trusted by 10,000+ devs</span>
              </div> */}
            </motion.div>
          </div>

          <div className="hidden lg:block order-1 lg:order-2 perspective-1000 relative z-20">
            <InteractiveTerminal />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#edae00] blur-[80px] opacity-20" />
          </div>
        </motion.div>
      </section>

      {/* --- LOGO CLOUD --- */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="container px-4 mx-auto">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest">Powering teams at innovative companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 text-xl font-bold"><Github className="w-8 h-8" /> GitHub</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Slack className="w-8 h-8" /> Slack</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Figma className="w-8 h-8" /> Figma</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Trello className="w-8 h-8" /> Trello</div>
            <div className="flex items-center gap-2 text-xl font-bold"><GitBranch className="w-8 h-8" /> GitLab</div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <ParallaxSection className=" relative z-10" speed={0.05}>
        <div className="container px-4 mx-auto">
          <SectionHeader
            title="Everything needed to ship."
            subtitle="A complete environment for coding, testing, and collaboration. No setup required."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <FeatureCard
              icon={Code2}
              title="Real-time Collaboration"
              description="See cursors, selections, and edits instantly. Pair program with zero latency issues."
              delay={0}
            />
            <FeatureCard
              icon={Trophy}
              title="Global Contests"
              description="Compete in weekly algorithmic challenges. Climb the leaderboard and earn badges."
              delay={0.1}
            />
            <FeatureCard
              icon={Shield}
              title="Secure Sandbox"
              description="Execute code in isolated VM2 environments. Support for 20+ languages."
              delay={0.2}
            />
            <FeatureCard
              icon={MessageSquare}
              title="Integrated Chat"
              description="Discuss solutions with voice, video, and text chat right in the editor."
              delay={0.3}
            />
            <FeatureCard
              icon={Zap}
              title="Instant Feedback"
              description="Get real-time linting, error checking, and test case results as you type."
              delay={0.4}
            />
            <FeatureCard
              icon={Globe}
              title="Browser Based"
              description="Access your workspace from any device. Your environment travels with you."
              delay={0.5}
            />
          </div>
        </div>
      </ParallaxSection>

      {/* --- WORKFLOW SECTION --- */}
      <section className="py-32  relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="container px-4 mx-auto">
          <SectionHeader title="How CodeLab Works" subtitle="From idea to execution in three simple steps." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#edae00]/0 via-[#edae00]/30 to-[#edae00]/0 z-0" />

            <StepCard
              number="01"
              title="Create a Room"
              description="Start a new collaborative session or join an existing one instantly with a unique link."
            />
            <StepCard
              number="02"
              title="Invite & Code"
              description="Invite your team. Code together in real-time with shared context and integrated communication tools."
            />
            <StepCard
              number="03"
              title="Run & Review"
              description="Execute code in the cloud, run test cases, and review output together seamlessly."
            />
          </div>
        </div>
      </section>

      {/* --- USE CASES SECTION --- */}
      <section className="py-32  border-t border-white/5 relative z-10">
        <div className="container px-4 mx-auto">
          <SectionHeader
            title="Built for Every Coder"
            subtitle="Whether you're a student, a hiring manager, or a competitive pro, CodeLab is designed for you."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <FeatureCard
              icon={Users}
              title="Personal Practice"
              description="Master new languages, solve problems, and build your portfolio in a clean, zero-config environment."
              delay={0}
            />
            <FeatureCard
              icon={Briefcase}
              title="Technical Interviews"
              description="Conduct seamless remote interviews with real-time code execution, video calls, and shared whiteboards."
              delay={0.1}
            />
            <FeatureCard
              icon={GraduationCap}
              title="Colleges & Education"
              description="Modernize your CS curriculum. Host live coding labs, assignments, and mentorship sessions effortlessly."
              delay={0.2}
            />
            <FeatureCard
              icon={Trophy}
              title="Competitive Coding"
              description="Practice for top-tier competitions or host your own contests with automated judging and live leaderboards."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* --- LASER SPEED SECTION --- */}
     <section className="relative py-32 overflow-hidden min-h-dvh flex items-center">
  {/* Ambient background */}
  <div className="absolute inset-0 z-0">
    <LaserFlow
      color="#edae00"
      wispDensity={1.5}
      flowSpeed={0.5}
      className="opacity-40"
    />
  </div>

  {/* Content wrapper */}
  <div className="relative z-10 container mx-auto px-6">
    <div className="max-w-5xl mx-auto bg-background/60 backdrop-blur-3xl 
                    border border-white/10 rounded-3xl p-10 md:p-14">

      {/* Header stack */}
      <div className="text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-bold mb-5">
          Engineered for <span className="text-[#edae00]">Collab</span>
        </h2>
        <p className="text-lg md:text-xl text-primary/60 max-w-2xl mx-auto">
          We’ve optimized the entire stack to deliver lightning-fast,
          realtime collaboration at global scale.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="group aspect-square flex flex-col items-center justify-center
                         rounded-2xl p-6 text-center
                         bg-white/5 border border-white/5
                         hover:border-[#edae00]/40 hover:bg-white/10
                         transition-all duration-300"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                              bg-[#edae00]/10 text-[#edae00]
                              group-hover:scale-110 transition">
                <Icon size={22} />
              </div>

              <div className="text-xs uppercase tracking-wider font-bold text-[#edae00]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</section>


      {/* --- ILLUSTRATION / DETAILS --- */}
      <ParallaxSection speed={0.1} className=" border-t border-white/5 min-h-dvh">
        <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 mt-auto mb-auto">
          <div className="order-2 lg:order-1 relative flex justify-center">
            {/* Abstract Illustration */}
            <div className="relative w-full max-w-sm aspect-square">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full  border-dashed border"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[15%] rounded-full border border-dotted "
              />
              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8">
                <div className="bg-muted/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center aspect-square shadow-xl">
                  <Cpu className="w-8 h-8 text-[#edae00] mb-2" />
                  <span className="text-xs font-mono text-gray-400">Compute</span>
                </div>
                <div className="bg-muted/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center aspect-square shadow-xl translate-y-8">
                  <Globe className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-xs font-mono text-gray-400">Network</span>
                </div>
                <div className="bg-muted/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center aspect-square shadow-xl -translate-y-8">
                  <Terminal className="w-8 h-8 text-green-500 mb-2" />
                  <span className="text-xs font-mono text-gray-400">Shell</span>
                </div>
                <div className="bg-muted/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center aspect-square shadow-xl">
                  <Layers className="w-8 h-8 text-purple-500 mb-2" />
                  <span className="text-xs font-mono text-gray-400">Stack</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeader
              title="Developer Experience First"
              subtitle="We built CodeLab because we were tired of context switching. Everything you need is right here."
              align="left"
            />
            <ul className="space-y-6">
              {[
                { title: "Keyboard Centric", desc: "Vim & Emacs keybindings supported out of the box." },
                { title: "Dark Mode Native", desc: "Designed for high contrast and low eye strain." },
                { title: "Extension Ready", desc: "Customize your environment with themes and snippets." },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 w-6 h-6 rounded-full bg-[#edae00]/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-[#edae00]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold ">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </ParallaxSection>

      {/* --- PRICING SECTION --- */}
      <section className="py-24  border-t border-white/5">
        <div className="container px-4 mx-auto">
          <SectionHeader title="Simple, Transparent Pricing" subtitle="Start for free, scale as you grow." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="Hobby"
              price="Free"
              features={["Unlimited public rooms", "Basic code execution", "Community support", "50MB Storage"]}
            />
            <PricingCard
              title="Pro"
              price="$12"
              recommended={true}
              features={["Unlimited private rooms", "Priority execution", "Voice & Video calls", "Advanced cheat detection", "10GB Storage"]}
            />
            <PricingCard
              title="Team"
              price="$49"
              features={["SSO & Admin controls", "Custom branding", "Dedicated infrastructure", "24/7 Priority support", "Unlimited Storage"]}
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#edae00]/10 to-transparent pointer-events-none" />

        <div className="container px-4 mx-auto relative z-10 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Ready to code <span className="text-[#edae00]">better?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of developers who are already using CodeLab to collaborate, compete, and build amazing things.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="h-16 px-12 text-xl rounded-full bg-[#edae00] text-black hover:bg-[#d49b00] font-bold shadow-[0_0_30px_rgba(237,174,0,0.4)] hover:scale-105 transition-all">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" className="h-16 px-12 text-xl rounded-full border-white/20 hover:bg-white/10 font-bold hover:scale-105 transition-all">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10  text-gray-500 text-sm">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#edae00] rounded-lg flex items-center justify-center text-black font-bold">CL</div>
            <span className="font-bold  text-lg">CodeLab</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-[#edae00] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#edae00] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#edae00] transition-colors">Status</Link>
            <Link href="#" className="hover:text-[#edae00] transition-colors">GitHub</Link>
          </div>
          <div>
            &copy; 2026 CodeLab Inc. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
