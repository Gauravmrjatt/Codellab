'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Command } from 'lucide-react';

export default function InteractiveTerminal() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]), { stiffness: 150, damping: 20 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  // Auto-typing effect state
  const [text, setText] = useState('');
  const codeSnippet = `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> json = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int com = target - nums[i];
        
            if (json.containsKey(com)) {
                return new int[] { json.get(com), i };
            }
            json.put(nums[i], i);
        }
    
        return new int[] { -1, -1 };
    }
}

`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(codeSnippet.slice(0, index));
      index++;
      if (index > codeSnippet.length) {
         // reset or stop? let's loop with a pause
         clearInterval(interval);
         setTimeout(() => {
             setText(codeSnippet);
             // Re-trigger effect? Simplified for now to just stop or loop manually if needed.
             // For this demo, let's just stop at completion or maybe loop in a real app.
         }, 5000);
      }
    }, 50); // Typing speed
    return () => clearInterval(interval);
  }, []);


  return (
    <motion.div
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative w-full max-w-lg aspect-18/12 cursor-pointer group"
    >
      {/* Glow behind */}
      <div className="absolute inset-0 bg-[#edae00] blur-[100px] opacity-20 -z-10 transition-opacity duration-500 group-hover:opacity-40" />
      
      <div className="relative h-full w-full rounded-xl border border-white/10 bg-muted/90 backdrop-blur-xl shadow-2xl overflow-hidden transform-style-3d">
        {/* Window Controls */}
        <div className="h-8  flex items-center px-4 gap-2 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <div className="ml-4 text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Command className="w-3 h-3" /> main.java
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 font-mono text-xs sm:text-sm  relative h-full overflow-hidden">
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
             <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/> Gaurav is typing...
             </div>
             <div className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] rounded border border-green-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"/> 2 Viewers
             </div>
          </div>

          <pre className="whitespace-pre-wrap">
            <code className="language-javascript">
              {text}
              <motion.span
                 animate={{ opacity: [1, 0, 1] }}
                 transition={{ duration: 0.8, repeat: Infinity }}
                 className="inline-block w-2 h-4 bg-[#edae00] ml-1 align-middle"
               />
            </code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
