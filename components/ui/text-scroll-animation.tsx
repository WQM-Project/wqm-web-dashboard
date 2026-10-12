'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

function ScrollCharacter({ char, distance, progress, spread, reducedMotion }: {
  char: string;
  distance: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  spread: number;
  reducedMotion: boolean;
}) {
  const x = useTransform(progress, [0, 0.4, 0.8, 1], [distance * spread, 0, 0, distance * spread * 0.3]);
  const rotateX = useTransform(progress, [0, 0.4], [distance * 12, 0]);
  const y = useTransform(progress, [0, 0.4], [Math.abs(distance) * 2, 0]);

  return (
    <motion.span className="inline-block" style={{
      x: reducedMotion ? 0 : x,
      y: reducedMotion ? 0 : y,
      rotateX: reducedMotion ? 0 : rotateX,
    }}>{char}</motion.span>
  );
}

export function ScrollText({ text, className, spread = 5 }: {
  text: string;
  className?: string;
  spread?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const center = (text.length - 1) / 2;
  let index = 0;

  return (
    <span ref={ref} className={cn('inline-block', className)} style={{ perspective: '700px' }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((word, wordIndex) => {
          const start = index;
          index += word.length + 1;
          return (
            <span key={wordIndex} className="inline-block whitespace-nowrap" style={{ marginRight: wordIndex < text.split(' ').length - 1 ? '0.25em' : 0 }}>
              {Array.from(word).map((char, charIndex) => (
                <ScrollCharacter key={charIndex} char={char} distance={start + charIndex - center}
                  progress={scrollYProgress} spread={spread} reducedMotion={!!reducedMotion} />
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 65%'] });
  const y = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  return <motion.div ref={ref} className={className} style={{ y: reducedMotion ? 0 : y, opacity: reducedMotion ? 1 : opacity }}>{children}</motion.div>;
}
