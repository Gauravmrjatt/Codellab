'use client'
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,

} from 'framer-motion';
import * as THREE from 'three';
import {
  Zap, ShieldAlert, Video, Cpu, Globe,
  ChevronRight, Terminal, Lock, Activity, CheckCircle2,
  Trophy, Shield, Slack, Figma, Github,
  Antenna,
  FolderCode,
  SquareCode
} from 'lucide-react';
import Link from 'next/link'
// --- Constants ---
const PRIMARY_HEX = "#edae00";
const PRIMARY_GLOW = "rgba(237, 174, 0, 0.15)";
import Grainient from "@/components/Grainient"
// --- Reusable Motion Components ---
const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// --- Background Component (Three.js) ---
const ThreeBackground = () => {
  const containerRef = useRef();

  useEffect(() => {
    let scene, camera, renderer, particles;
    const container = containerRef.current;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 1200; i++) {
      vertices.push(
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      color: new THREE.Color(PRIMARY_HEX),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 500;

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.0002;
      particles.rotation.x += 0.0001;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    animate();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none" />;
};

// --- Sub-components ---

const Badge = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edae00]/10 border border-[#edae00]/20 text-[#edae00] text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#edae00] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#edae00]"></span>
    </span>
    {children}
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <FadeIn delay={delay}>
    <div className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#edae00]/30 transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-[#edae00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-[#edae00]/10 flex items-center justify-center mb-6 text-[#edae00] group-hover:scale-110 group-hover:bg-[#edae00] group-hover:text-black transition-all duration-500">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">
          {description}
        </p>
      </div>
    </div>
  </FadeIn>
);

const RotatingText = ({ texts }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % texts.length), 3000);
    return () => clearInterval(timer);
  }, [texts.length]);

  return (
    <div className="relative h-[1.2em] inline-block overflow-hidden align-bottom min-w-[300px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 text-[#edae00]"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <div className="min-h-screen bg-[#02040a] text-white selection:bg-[#edae00]/30 overflow-x-hidden font-sans">
      <div className='absolute w-full h-full'>
        <Grainient
          color1="#121212"
          color2="#4c3b0b"
          color3="#1b180e"
          timeSpeed={1.05}
          colorBalance={-0.02}
          warpStrength={0.45}
          warpFrequency={5}
          warpSpeed={0}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#edae00] to-[#f59e0b] rounded-xl flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(237,174,0,0.3)]">C</div>
            <span className="text-xl font-bold tracking-tight">CodeLab</span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
            <Link href="/rooms" className="hover:text-white transition-colors">Workspace</Link>
            <Link href="/contests" className="hover:text-white transition-colors">Contests</Link>
            <Link href="/problems" className="hover:text-white transition-colors">Problems</Link>
          </div>
          <div className="flex items-center gap-6">

            <Link href='/login'>
              <button className="bg-[#edae00] text-black hover:bg-[#ffbf00] px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#edae00]/20">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 px-6 overflow-hidden ">
      
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="text-center max-w-5xl mx-auto z-10 relative min-h-100dvh"
        >

          <FadeIn delay={0.1}>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05] text-shadow-[2px_6px_#5a4242]">
              Code Together. <br />
              <RotatingText texts={['Build Faster.', 'Ship Better.', 'Scale Up.']} />
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              The high-performance collaborative workspace for engineering teams.
              Real-time editing, secure runtimes, and integrated intelligence.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href='/dashboard'>
                <button className="w-full sm:w-auto px-10 py-5 bg-[#edae00] text-black font-black rounded-2xl hover:bg-[#ffbf00] transition-all text-lg flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(237,174,0,0.2)] group">
                  Start Now <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href='/contests'>
                <button className="w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-md text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-lg">
                  Explore Contests
                </button>
              </Link>
            </div>
          </FadeIn>
        </motion.div>

        {/* Floating Stats - Subtle Hero Polish */}
        <div className="max-w-7xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50  text-shadow-[2px_2px_#000000]">
          {[
            { label: 'Sync Latency', val: '< 100ms' },
            { label: 'Uptime', val: '99.99%' },
            { label: 'Active Devs', val: '10+' },
            { label: 'Features', val: '10+' },
          ].map((stat, i) => (
            <div key={i} className="text-center ">
              <div className="text-2xl font-bold text-white">{stat.val}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#edae00] font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-white/5  ">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] text-gray-500 mb-10 uppercase tracking-[0.4em] font-bold">Build with Latest tech</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 text-shadow-[2px_2px_#000000] ">
            <div className="flex items-center gap-3 font-bold text-xl bg-transparent backdrop-blur-3xl "><FolderCode /> Node Js</div>
            <div className="flex items-center gap-3 font-bold text-xl"><Antenna /> Socket</div>
            <div className="flex items-center gap-3 font-bold text-xl"><SquareCode /> Nextjs</div>
            <div className="flex items-center gap-3 font-bold text-xl"><Lock /> Docker</div>
            <div className="flex items-center gap-3 font-bold text-xl"><Activity /> Postgress</div>
          </div>
        </div>
      </section>

      {/* The Workspace - Proof of Product */}
      <section className=" relative min-h-100dvh">
          <div className='absolute w-full h-full'>
          <Grainient
            color1="#121111"
            color2="#767060"
            color3="#312e26"
            timeSpeed={0.45}
            colorBalance={0}
            warpStrength={0}
            warpFrequency={12}
            warpSpeed={0}
            warpAmplitude={50}
            blendAngle={129}
            blendSoftness={0}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
        <div className=" py-32 px-6 max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for <span className="text-[#edae00]">Focus.</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Every tool you need, integrated into a single, seamless environment.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#edae00]/50 to-orange-500/50 rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-[#0b0e14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Editor Top Bar */}
                <div className="bg-[#161b22] border-b border-white/5 p-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/30"></div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-lg text-[11px] font-mono text-gray-500 tracking-wider">
                    <Terminal className="w-3 h-3 text-[#edae00]" />
                    workspace / collab_engine.rs
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      <div className="w-7 h-7 rounded-full bg-[#edae00] border-2 border-[#161b22] flex items-center justify-center text-[8px] font-bold text-black">GC</div>
                      <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-[#161b22] flex items-center justify-center text-[8px] font-bold">SC</div>
                      <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-[#161b22] flex items-center justify-center text-[8px] font-bold">YS</div>
                    </div>
                  </div>
                </div>
                {/* Editor Content */}
                <div className="p-8 grid md:grid-cols-4 gap-8 min-h-[500px]">
                  <div className="md:col-span-3 font-mono text-sm leading-relaxed overflow-x-auto">
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">1</span><span className="text-purple-400">use</span> std::sync::Arc;</div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">2</span><span className="text-purple-400">use</span> tokio::sync::Mutex;</div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">3</span><span>&nbsp;</span></div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">4</span><span className="text-yellow-500">pub struct</span> <span className="text-[#edae00]">CodeLabStream</span> {'{'}</div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">5</span><span className="ml-4 text-blue-300">state</span>: Arc&lt;Mutex&lt;AppState&gt;&gt;,</div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">6</span><span className="ml-4 border-l-2 border-[#edae00] pl-2 bg-[#edae00]/5">cursor_pos: <span className="text-green-400">Vec2::new(140, 22)</span>, <span className="animate-pulse">|</span></span></div>
                    <div className="flex gap-6 mb-1"><span className="text-gray-700 w-4">7</span>{'}'}</div>
                    <div className="flex gap-6 mb-1 mt-4"><span className="text-gray-700 w-4">8</span><span className="text-gray-600">// Replicating state to 24 edge nodes...</span></div>
                  </div>
                  {/* Right Sidebar */}
                  <div className="hidden md:block bg-black/20 rounded-xl p-5 border border-white/5 h-fit">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-[#edae00]" /> Users
                    </h4>
                    <div className="space-y-6">
                      {[
                        { u: 'Gaurav Chaudhary', action: 'Typing...', color: '#edae00' },
                        { u: 'Shubham Chaudhary', action: 'Connected', color: '#3b82f6' },
                        { u: 'Yash Singh', action: 'Idle', color: '#22c55e' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
                          <div>
                            <div className="text-[11px] font-bold text-gray-300">{item.u}</div>
                            <div className="text-[9px] text-gray-500">{item.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Zap}
            title="Real-time Engine"
            description="Built on top of a custom CRDT implementation for conflict-free editing across distributed teams."
            delay={0}
          />
          <FeatureCard
            icon={Video}
            title="Spatial Audio & Video"
            description="Communicate naturally with low-latency WebRTC streams integrated directly into the workspace."
            delay={0.1}
          />
          <FeatureCard
            icon={Cpu}
            title="Isolated Runtimes"
            description="Execute code in gVisor-hardened sandboxes supporting 40+ programming languages instantly."
            delay={0.2}
          />
          <FeatureCard
            icon={Shield}
            title="Enterprise Security"
            description="SOC2 compliant, SSO integration, and role-based access controls for your entire org."
            delay={0.3}
          />
          <FeatureCard
            icon={Trophy}
            title="Algorithmic Contests"
            description="Host global scale hackathons or private hiring assessments with automated grading."
            delay={0.4}
          />
          <FeatureCard
            icon={Globe}
            title="Edge Deployment"
            description="Deploy your workspace to the nearest of our 150+ edge nodes for zero-lag performance."
            delay={0.5}
          />
        </div>
      </section>

      {/* Anti-Cheat Section - The Unique Value */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#edae00]/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <FadeIn direction="right">
              <div className="p-3 w-fit bg-[#edae00]/10 rounded-2xl mb-8 text-[#edae00]">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Integrity <br /><span className="text-[#edae00]">By Design.</span></h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl">
                Maintain absolute trust in your contests and interviews with our proprietary
                behavioral analysis engine that detects anomalies in real-time.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  "Bulk-paste heuristics",
                  "Pattern velocity tracking",
                  "Tab-focus forensics",
                  "Timeline replay system"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#edae00]" />
                    {item}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <div className="flex-1 w-full max-w-xl">
            <FadeIn delay={0.3} direction="left">
              <div className="bg-[#12161f] border border-[#edae00]/20 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-6 right-8">
                  <div className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-500/20">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Security Alert
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[#edae00]" /> Threat Detection
                </h4>
                <div className="space-y-4">
                  <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 group hover:bg-white/[0.06] transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate ID: #8821</span>
                      <span className="text-[10px] font-bold text-[#edae00]">Risk Score: High</span>
                    </div>
                    <div className="text-sm font-bold mb-1">Instantaneous Large Paste</div>
                    <div className="text-xs text-gray-500 leading-relaxed">Detected 840 characters inserted at Line 42 in 1.4ms. Source: Clipboard (External).</div>
                  </div>
                  <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 opacity-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate ID: #9042</span>
                      <span className="text-[10px] font-bold text-blue-400">Normal</span>
                    </div>
                    <div className="text-sm font-bold mb-1">Consistent Typing Cadence</div>
                    <div className="text-xs text-gray-500 leading-relaxed">Keystroke timing matches natural developer patterns.</div>
                  </div>
                </div>
                <button className="w-full mt-8 py-4 text-xs text-[#edae00] font-black hover:bg-[#edae00]/10 border border-[#edae00]/20 rounded-xl transition-all uppercase tracking-[0.2em]">
                  View Full Audit Log
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Simplified Workflow */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Zero Friction <span className="text-[#edae00]">Workflow.</span></h2>
            <p className="text-gray-400">Start coding in seconds, not minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            {/* Desktop Connector */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#edae00]/20 to-transparent -translate-y-1/2" />

            {[
              { n: '01', t: 'Initialize Room', d: 'Spin up a secure environment instantly with a single command or URL share.' },
              { n: '02', t: 'Collaborate Live', d: 'Work with your team using shared state, video, and integrated whiteboards.' },
              { n: '03', t: 'Deploy & Audit', d: 'Execute code in a protected runtime and get detailed performance metrics.' },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-[#edae00]/10 border border-[#edae00]/30 flex items-center justify-center text-3xl font-black text-[#edae00] mb-8 shadow-[0_10px_30px_rgba(237,174,0,0.15)] group-hover:scale-110 transition-transform">
                    {step.n}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.t}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-[250px]">{step.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 mb-20">
        <FadeIn>
          <div className="max-w-5xl mx-auto rounded-[3.5rem] p-16 md:p-24 text-center relative overflow-hidden border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#edae00] to-transparent" />

            <h2 className="text-5xl md:text-7xl font-black mb-10 leading-tight">
              Ready to code at the <br /> <span className="text-[#edae00]">speed of light?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-14 max-w-xl mx-auto font-medium">
              Join developers  on CodeLab.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href='/dashboard'>
                <button className="px-12 py-5 bg-[#edae00] text-black font-black rounded-2xl transition-all shadow-xl hover:bg-[#ffbf00] text-lg transform hover:-translate-y-1">
                  Get Started Free
                </button>
              </Link>

            </div>

            <div className="mt-16 flex justify-center gap-8 opacity-40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Shield className="w-4 h-4" /> Enterprise-ready</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Zap className="w-4 h-4" /> Global Edge</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Lock className="w-4 h-4" /> SOC2 Type II</div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-[#edae00] rounded-lg flex items-center justify-center font-black text-black">C</div>
              <span className="text-xl font-bold">CodeLab</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Revolutionizing technical collaboration for the modern era. Build, test, and ship together.
            </p>
          </div>

          {[
            { t: 'Product', l: ['Workspace', 'Code Editor', 'Anti-Cheat', 'Runtimes', 'Security'] },
            { t: 'Company', l: ['About Us', 'Careers', 'Engineering Blog', 'Brand Assets', 'Contact'] },
            { t: 'Legal', l: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security Compliance'] },
          ].map((col, i) => (
            <div key={i}>
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-8">{col.t}</h5>
              <ul className="space-y-4">
                {col.l.map((item, j) => (
                  <li key={j}><a href="#" className="text-gray-500 hover:text-[#edae00] text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-8">
          <p className="text-xs text-gray-600 font-medium">© 2025 CodeLab Inc. All rights reserved. Designed for speed.</p>
          <div className="flex gap-10">
            <Github className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
            <Slack className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
            <Figma className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}