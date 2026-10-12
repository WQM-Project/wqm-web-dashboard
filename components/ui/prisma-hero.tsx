'use client';

import Link from 'next/link';
import localFont from 'next/font/local';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/ui/header-2';
import { useLandingTheme } from '@/components/landing/landing-theme';
import { ScrollText, ScrollReveal } from '@/components/ui/text-scroll-animation';
import { HeroBackground } from '@/components/landing/hero-background';

const googleSans = localFont({
  src: '../../public/fonts/google-sans/google-sans-medium.ttf',
  weight: '500',
  style: 'normal',
  display: 'swap',
});

export function PrismaHero() {
  const { theme } = useLandingTheme();
  return (
    <section id="boat-scene" aria-labelledby="landing-title" className="bg-[var(--landing-bg)] p-2 text-[var(--landing-fg)] md:p-4">
      <Header appearance="notch" />
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col justify-end overflow-hidden rounded-2xl md:min-h-[calc(100svh-2rem)] md:rounded-[2rem]">
        <HeroBackground />
        <div className="absolute inset-0 -z-10" style={{ background: theme === 'dark' ? 'linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.1) 35%, rgba(0,0,0,.85))' : 'linear-gradient(to bottom, transparent 40%, rgba(248,248,244,.3) 70%, rgba(248,248,244,.75))' }} />

        <div className="grid grid-cols-12 items-end gap-x-8 gap-y-8 px-6 pb-8 pt-40 md:px-10 lg:pb-10">
          <div className="col-span-12 lg:col-span-8">
            <div className="w-fit max-w-full">
              <h1 id="landing-title" className="text-center text-balance text-[28vw] font-semibold leading-[0.85] tracking-[-0.075em] lg:text-[17.5vw]">
                <ScrollText text="WQM" spread={24} />
              </h1>
              <p className={`${googleSans.className} relative left-[1.2vw] mt-2 whitespace-nowrap text-center text-[5.4vw] font-medium leading-tight tracking-tight lg:left-[0.8vw] lg:mt-3 lg:text-[3.4vw]`}>&ensp;   Water Quality Monitoring</p>
            </div>
          </div>

          <ScrollReveal
            className="col-span-12 flex max-w-md flex-col items-start gap-6 lg:col-span-4 lg:pb-2"
          >
            <p className="text-pretty text-sm leading-relaxed text-[var(--landing-fg)] md:text-base">A remote-controlled boat for river water-quality monitoring, with onboard sensors, a LoRa link to shore, and a dashboard to explore measurements and trends.</p>
            <Link href="/dashboard" className="group inline-flex items-center gap-5 rounded-full bg-[var(--landing-button)] py-1 pl-5 pr-1 text-sm font-medium text-[var(--landing-button-text)] focus-visible:outline-2 focus-visible:outline-offset-4 md:text-base">
              Explore the readings
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--landing-button-text)] text-[var(--landing-button)]">
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
