'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/ui/header-2';
import { cn } from '@/lib/utils';

export function WordsPullUp({ text, className, style }: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();

  return (
    <span ref={ref} className={cn('inline-flex flex-wrap gap-x-[0.25em]', className)} style={style}>
      {text.split(' ').map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none"
          style={{
            transform: visible || reducedMotion ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible || reducedMotion ? 1 : 0,
            transitionDelay: reducedMotion ? '0ms' : `${index * 80}ms`,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function PrismaHero() {
  return (
    <section id="boat-scene" aria-labelledby="landing-title" className="bg-stone-950 p-2 text-[#E1E0CC] md:p-4">
      <Header appearance="notch" />
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col justify-end overflow-hidden rounded-2xl md:min-h-[calc(100svh-2rem)] md:rounded-[2rem]">
        <Image src="/landing/sensor-boat.png" alt="Sensor boat on a mountain river" fill priority sizes="100vw" className="-z-20 object-cover object-[65%_center] md:object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/10 to-black/85" />

        <div className="grid grid-cols-12 items-end gap-x-8 gap-y-8 px-6 pb-8 pt-40 md:px-10 lg:pb-10">
          <div className="col-span-12 lg:col-span-8">
            <p className="mb-6 text-base font-medium md:text-xl">Monitor the Beas.</p>
            <h1 id="landing-title" className="text-balance text-[34vw] font-semibold leading-[0.85] tracking-[-0.075em] lg:text-[22vw]">
              <WordsPullUp text="WQM" />
            </h1>
          </div>

          <div
            className="col-span-12 flex max-w-md flex-col items-start gap-6 lg:col-span-4 lg:pb-2"
          >
            <p className="text-pretty text-sm leading-relaxed text-[#E1E0CC]/90 md:text-base">A student-built boat for understanding our rivers. Water-quality sensors on board, a LoRa link to shore, and a workspace that brings the readings into view.</p>
            <Link href="/dashboard" className="group inline-flex items-center gap-5 rounded-full bg-[#E1E0CC] py-1 pl-5 pr-1 text-sm font-medium text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1E0CC] md:text-base">
              Explore the readings
              <span className="flex size-10 items-center justify-center rounded-full bg-stone-950 text-[#E1E0CC]">
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
