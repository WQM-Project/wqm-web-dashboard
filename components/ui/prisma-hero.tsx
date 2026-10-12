'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/ui/header-2';
import { cn } from '@/lib/utils';
import { useLandingTheme } from '@/components/landing/landing-theme';

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
  const { theme } = useLandingTheme();
  return (
    <section id="boat-scene" aria-labelledby="landing-title" className="bg-[var(--landing-bg)] p-2 text-[var(--landing-fg)] md:p-4">
      <Header appearance="notch" />
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col justify-end overflow-hidden rounded-2xl md:min-h-[calc(100svh-2rem)] md:rounded-[2rem]">
        <Image src="/landing/river-team-clay-hero.png" alt="Clay miniature of friends testing a small RC boat beside a turquoise river, with mountains and soft clouds" fill priority sizes="100vw" className="-z-20 object-cover object-[65%_center] md:object-center" />
        <div className="absolute inset-0 -z-10" style={{ background: theme === 'dark' ? 'linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.1) 35%, rgba(0,0,0,.85))' : 'linear-gradient(to bottom, rgba(248,248,244,.05), rgba(248,248,244,.12) 30%, rgba(248,248,244,.96))' }} />

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
            <p className="text-pretty text-sm leading-relaxed text-[var(--landing-fg)] md:text-base">A student-built project for understanding our rivers. Bringing water-quality sensing, a boat and a LoRa link together—one reading at a time.</p>
            <Link href="/dashboard" className="group inline-flex items-center gap-5 rounded-full bg-[var(--landing-button)] py-1 pl-5 pr-1 text-sm font-medium text-[var(--landing-button-text)] focus-visible:outline-2 focus-visible:outline-offset-4 md:text-base">
              Explore the readings
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--landing-button-text)] text-[var(--landing-button)]">
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
