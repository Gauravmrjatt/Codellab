'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface AntiGravityItem {
  title: string;
  description: string;
  icon?: LucideIcon;
  label?: string; // Optional tag/label
  color?: string; // Optional accent color
  size?: 'small' | 'medium' | 'large'; // For grid spanning
}

interface AntiGravityGridProps {
  items: AntiGravityItem[];
  className?: string;
}

const FloatingCard = ({ item, index }: { item: AntiGravityItem; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Randomize float parameters for natural feel
  const duration = 3 + Math.random() * 2; // 3-5s duration
  const delay = Math.random() * 2; // 0-2s delay
  const floatHeight = 10 + Math.random() * 10; // 10-20px float range

  // Mouse tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { top, left, width, height } = event.currentTarget.getBoundingClientRect();
    const xPos = event.clientX - left - width / 2;
    const yPos = event.clientY - top - height / 2;
    
    x.set(xPos);
    y.set(yPos);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  // Determine span classes
  const spanClass = 
    item.size === 'large' ? 'md:col-span-2 md:row-span-2' : 
    item.size === 'medium' ? 'md:col-span-2' : 
    'col-span-1';

  return (
    <motion.div
      className={cn("relative perspective-1000", spanClass)}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <motion.div
        animate={{ 
          y: [0, -floatHeight, 0],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="h-full"
      >
        <Card className="h-full bg-background/40 backdrop-blur-md border-white/10 hover:border-[#edae00]/50 hover:bg-white/5 transition-all duration-300 shadow-xl overflow-hidden group">
          {/* Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-br from-[#edae00]/10 via-transparent to-transparent" />
          </div>

          <CardHeader className="relative z-10">
            <div className="flex items-start justify-between">
              {item.icon && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300 group-hover:border-[#edae00]/30 group-hover:text-[#edae00]">
                  <item.icon className="w-6 h-6" />
                </div>
              )}
              {item.label && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border border-white/10 bg-black/20 text-muted-foreground group-hover:text-[#edae00] group-hover:border-[#edae00]/30 transition-colors">
                  {item.label}
                </span>
              )}
            </div>
            <CardTitle className="mt-4 text-xl group-hover:text-[#edae00] transition-colors">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardDescription className="text-base leading-relaxed">
              {item.description}
            </CardDescription>
          </CardContent>
          
          {/* Bottom highlight line */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#edae00]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export function AntiGravityGrid({ items, className }: AntiGravityGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4", className)}>
      {items.map((item, index) => (
        <FloatingCard key={index} item={item} index={index} />
      ))}
    </div>
  );
}
