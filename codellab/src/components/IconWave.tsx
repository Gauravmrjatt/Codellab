'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, Terminal, Cpu, Database, Cloud, 
  GitBranch, Smartphone, Globe, Box, Layers, 
  Command, Hash, Braces, FileJson, Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  Code2, Terminal, Cpu, Database, Cloud, 
  GitBranch, Smartphone, Globe, Box, Layers, 
  Command, Hash, Braces, FileJson, Server,
  Code2, Terminal, Cpu, Database, Cloud
];

interface IconWaveProps {
  className?: string;
}

export function IconWave({ className }: IconWaveProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-background/50 backdrop-blur-sm py-12 border-y border-white/5", className)}>
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Moving Track */}
      <div className="flex">
        <motion.div 
          className="flex gap-16 min-w-full"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 30 
          }}
        >
          {/* Double the icons for seamless loop */}
          {[...icons, ...icons].map((Icon, index) => (
            <motion.div
              key={index}
              className="relative group"
              whileHover={{ 
                scale: 1.2, 
                rotate: 10,
                color: "#edae00"
              }}
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#edae00]/50 transition-colors shadow-lg">
                <Icon className="w-8 h-8 text-muted-foreground group-hover:text-[#edae00] transition-colors" />
              </div>
              
              {/* Sine Wave Vertical Motion */}
              <motion.div
                className="absolute -bottom-2 left-1/2 w-1 h-1 bg-[#edae00] rounded-full opacity-0 group-hover:opacity-100"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
