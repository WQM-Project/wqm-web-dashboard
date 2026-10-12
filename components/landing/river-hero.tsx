'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Header } from '@/components/ui/header-2';

export function RiverHero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });
  useMotionValueEvent(scrollYProgress, 'change', setProgress);

  // Move into the landscape before revealing the boat photograph.
  const landscapeScale = useTransform(scrollYProgress, [0, 0.65], [1, 1.3]);
  const landscapeY = useTransform(scrollYProgress, [0, 0.65], ['0%', '-8%']);
  const boatOpacity = Math.min(1, Math.max(0, (progress - 0.3) / 0.35));
  const boatScale = useTransform(scrollYProgress, [0.3, 1], [1.2, 1]);
  const titleOpacity = 1 - Math.min(1, Math.max(0, (progress - 0.3) / 0.2));
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);
  const detailOpacity = Math.min(1, Math.max(0, (progress - 0.6) / 0.2));
  const detailY = useTransform(scrollYProgress, [0.6, 0.8], [24, 0]);

  return (
    <main className="bg-stone-950 text-white">
      <Header />
      <section ref={heroRef} className="relative h-[280svh] motion-reduce:h-dvh" aria-labelledby="river-title">
        <span id="boat-scene" className="absolute top-[180svh] motion-reduce:top-0" aria-hidden="true" />
        <div className="sticky top-0 isolate flex h-dvh flex-col overflow-hidden">
          <motion.div className="absolute inset-0 -z-20" style={{ scale: reducedMotion ? 1 : landscapeScale, y: reducedMotion ? 0 : landscapeY }}>
            <Image src="/hero-landscape.png" alt="Green mountain slopes, trees and wildflowers" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
          <motion.div className="absolute inset-0 -z-20" style={{ opacity: reducedMotion ? 1 : boatOpacity, scale: reducedMotion ? 1 : boatScale }}>
            <Image src="/landing/sensor-boat.png" alt="A twin-hull sensor boat on the water beneath forested mountains" fill priority sizes="100vw" className="object-cover object-[60%_center] md:object-center" />
          </motion.div>
          <div className="absolute inset-0 -z-10 bg-black/40" />

          <div className="relative mt-auto px-6 pb-10 pt-28 md:px-12 md:pb-12 lg:px-20">
            <motion.div style={{ opacity: reducedMotion ? 1 : titleOpacity, y: reducedMotion ? 0 : titleY }}>
              <p className="mb-6 text-sm font-medium">Water Quality Monitor</p>
              <h1 id="river-title" className="max-w-5xl text-balance font-serif text-6xl leading-none md:text-8xl lg:text-9xl">
                Monitor<br />the Beas.
              </h1>
              <p className="mt-6 max-w-sm text-pretty text-base leading-relaxed text-white/90 md:text-lg">A closer look at the water around us.</p>
            </motion.div>

            {!reducedMotion && (
              <motion.div className="absolute inset-x-6 bottom-32 md:inset-x-12 lg:inset-x-20" style={{ opacity: detailOpacity, y: detailY }}>
                <p className="mb-4 text-sm font-medium">From the river, to a reading.</p>
                <h2 className="max-w-lg text-balance font-serif text-4xl leading-tight md:text-6xl">Meet the boat.</h2>
                <p className="mt-4 max-w-xs text-pretty text-base leading-relaxed text-white/90">Water-quality sensors on board. Measurements sent ashore over LoRa.</p>
              </motion.div>
            )}

            <div className="mt-12 flex items-center justify-between gap-6 border-t border-white/30 pt-5">
              <span className="text-xs text-white/80">Built at IIT Mandi</span>
              <span className="flex items-center gap-2 text-xs text-white/80 motion-reduce:hidden">Scroll to explore <ArrowDown className="size-4" aria-hidden="true" /></span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
