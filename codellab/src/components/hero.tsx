'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Code2, Trophy, Shield } from "lucide-react"
import RotatingText from '@/components/RotatingText'
import { LaserFlow } from "@/components/LaserFlow"
import PixelBlast from "@/components/PixelBlast"
import { useRef } from "react"
import { useTheme } from "next-themes"
import { ShinyButton } from "@/components/ui/shiny-button";
import { Glow } from "@/components/ui/glow";
import { motion, useScroll, useTransform } from "framer-motion";


export function Hero() {
  const revealImgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-gradient-to-b from-background to-background/50">

      {/* PIXEL BLAST BACKGROUND */}
      <div className="absolute inset-0 -z-20 opacity-40 pointer-events-none">
        <PixelBlast
          variant="square"
          pixelSize={40}
          patternScale={3}
          color={theme === 'dark' ? '#edae00' : '#000000'}
          speed={0.5}
        />
      </div>

      {/* HERO GRID */}
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-[45%_55%] gap-16 items-center min-h-[100vh] pt-20 lg:pt-0">
        {/* LEFT : HERO TEXT (moves DOWN slower) */}
        <motion.div 
          style={{ y: textY, opacity }}
          className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left z-10"
        >
        
          <h1 className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            <div>Code Together,</div>

            <RotatingText
              texts={["Collaborate", "Code Live", "Compete", "Analyze", "Execute"]}
              mainClassName="px-2 sm:px-2 md:px-3 bg-[#edae00] text-white rounded-lg overflow-hidden py-0.5 sm:py-1 md:py-2"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2200}
            />

            <span className="text-primary">Better</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground rounded-xl">
            The ultimate collaborative coding platform. Practice algorithms, compete in real-time contests,
            and learn with developers worldwide in our interactive coding rooms.
          </p>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-6">
            <ShinyButton className="gap-2">
              Start Coding
            </ShinyButton>
          </div>
        </motion.div>

        {/* RIGHT : IMAGE + LASER (moves UP relative to scroll) */}
        <motion.div
          style={{ y: imageY, boxShadow: "2px 50px 120px 0px rgba(237,174,0,0.35)" }}
          className="relative w-full aspect-[16/9] rounded-2xl z-10 hidden lg:block"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const el = revealImgRef.current
            if (el) {
              el.style.setProperty('--mx', `${x}px`)
              el.style.setProperty('--my', `${y}px`)
            }
          }}
          onMouseLeave={() => {
            const el = revealImgRef.current
            if (el) {
              el.style.setProperty('--mx', '-9999px')
              el.style.setProperty('--my', '-9999px')
            }
          }}
        >

          {/* LASER LAYER */}
          <div className="absolute inset-0 top-[-100%] z-0">
            <LaserFlow
              color="#ae881e"
              horizontalSizing={0.78}
              verticalSizing={2.3}
              wispDensity={1.6}
            />
          </div>

          {/* IMAGE LAYER */}
          <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden border border-white/10">
            <img
              src={theme === "light" ? "/img/hero-light.png" : "/img/hero-dark.png"}
              alt="Platform Screenshot"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </motion.div>
      </div>



      {/* FEATURE CARDS - Slightly Overlapping Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mx-auto relative z-20 -mt-24 max-w-5xl grid grid-cols-1 gap-6 lg:grid-cols-3 px-6 pb-24"
      >
        <Card className="border-primary/20 bg-background/80 backdrop-blur-sm shadow-xl hover:-translate-y-2 transition-transform duration-300">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Real-time Collaboration</CardTitle>
            <CardDescription className="mt-2">
              Code together with live cursor tracking, instant sync, and conflict-free editing.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-background/80 backdrop-blur-sm shadow-xl hover:-translate-y-2 transition-transform duration-300">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Coding Contests</CardTitle>
            <CardDescription className="mt-2">
              Participate in time-bound contests with automatic judging and live leaderboards.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/20 bg-background/80 backdrop-blur-sm shadow-xl hover:-translate-y-2 transition-transform duration-300">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">Secure & Fair</CardTitle>
            <CardDescription className="mt-2">
              Sandboxed execution, cheat detection, and strong security guarantees fair play.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* STATS */}
      <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ duration: 1 }}
         className="mx-auto mb-24 max-w-3xl px-6"
      >
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            ["10K+", "Active Users"],
            ["500+", "Coding Problems"],
            ["50+", "Monthly Contests"],
            ["99.9%", "Uptime"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-[20%] bg-gradient-to-br from-primary/20 to-primary/5 opacity-20 blur-3xl" />
      </div>
    </section>
  )
}
