'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export function ContainerScroll({ titleComponent, children }: {
  titleComponent: ReactNode;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  useEffect(() => {
    const screen = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(screen.matches);
    update();
    screen.addEventListener('change', update);
    return () => screen.removeEventListener('change', update);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [mobile ? 24 : 32, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], mobile ? [0.9, 1] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-7xl px-4 py-24 md:px-12 md:py-36" style={{ perspective: '1000px' }}>
      <motion.div className="mx-auto mb-12 max-w-3xl text-center md:mb-16" style={{ y: reducedMotion ? 0 : translate }}>
        {titleComponent}
      </motion.div>
      <motion.div
        style={{ rotateX: reducedMotion ? 0 : rotate, scale: reducedMotion ? 1 : scale }}
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-panel)] p-2 shadow-xl md:rounded-[2rem] md:p-3"
      >
        <div className="relative w-full overflow-hidden rounded-2xl bg-[var(--landing-panel)] md:rounded-[1.25rem]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
