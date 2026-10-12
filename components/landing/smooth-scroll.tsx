'use client';

import type { ReactNode } from 'react';
import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';
import 'lenis/dist/lenis.css';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <ReactLenis root options={{
      autoRaf: true,
      lerp: reducedMotion ? 1 : 0.085,
      smoothWheel: !reducedMotion,
      syncTouch: false,
      anchors: { offset: -96, duration: reducedMotion ? 0 : 1 },
    }}>
      {children}
    </ReactLenis>
  );
}
