'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fadeIn' | 'slideIn' | 'stagger' | 'typewriter' | 'bounce' | 'flip';
  delay?: number;
  duration?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  children, 
  className = '', 
  animationType = 'fadeIn',
  delay = 0,
  duration = 1 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let tl: gsap.core.Timeline;

    switch (animationType) {
      case 'fadeIn':
        gsap.fromTo(
          element,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
        break;

      case 'slideIn':
        gsap.fromTo(
          element,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
        break;

      case 'stagger':
        const chars = Array.from(element.querySelectorAll('span'));
        gsap.fromTo(
          chars,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            delay,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
        break;

      case 'typewriter':
        // For typewriter effect, we need to wrap each character
        const text = element.textContent || '';
        element.innerHTML = '';

        const spans = text.split('').map(char => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space for regular spaces
          span.style.opacity = '0';
          element.appendChild(span);
          return span;
        });

        gsap.to(spans, {
          opacity: 1,
          duration: 0.05,
          stagger: 0.05,
          delay,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
          }
        });
        break;

      case 'bounce':
        gsap.fromTo(
          element,
          { scale: 0.3, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration,
            delay,
            ease: 'bounce.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
        break;

      case 'flip':
        gsap.fromTo(
          element,
          { rotationY: 90, opacity: 0 },
          {
            rotationY: 0,
            opacity: 1,
            duration,
            delay,
            ease: 'elastic.out(1, 0.3)',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
        break;

      default:
        gsap.fromTo(
          element,
          { opacity: 0 },
          {
            opacity: 1,
            duration,
            delay,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
            }
          }
        );
    }
  }, [animationType, delay, duration]);

  // For typewriter effect, we need to preserve the original text
  const renderChildren = () => {
    if (animationType === 'typewriter') {
      return <>{String(children)}</>;
    }
    
    if (animationType === 'stagger') {
      return (
        <>
          {String(children).split('').map((char, index) => (
            <span key={index}>{char}</span>
          ))}
        </>
      );
    }
    
    return children;
  };

  return (
    <div ref={elementRef} className={className}>
      {renderChildren()}
    </div>
  );
};

export default AnimatedText;