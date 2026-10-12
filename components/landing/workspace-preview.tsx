'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { ScrollText, ScrollReveal } from '@/components/ui/text-scroll-animation';
import { useLandingTheme } from './landing-theme';

export function WorkspacePreview() {
  const { theme } = useLandingTheme();
  return (
    <section id="workspace-preview" aria-labelledby="workspace-title" className="scroll-mt-24 overflow-hidden bg-[var(--landing-bg)] text-[var(--landing-fg)]">
      <ContainerScroll titleComponent={
        <>
          <p className="mb-5 text-sm text-[var(--landing-muted)]">The monitoring workspace</p>
          <h2 id="workspace-title" className="text-balance font-serif text-4xl leading-tight md:text-6xl"><ScrollText text="From the river." /><br /><ScrollText text="Into perspective." /></h2>
          <ScrollReveal><p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-[var(--landing-muted)]">Explore Boat 01’s water-quality readings, trends and location in one workspace.</p></ScrollReveal>
        </>
      }>
        <Image
          src={theme === 'dark' ? '/landing/dashboard-snapshot-dark-hd.webp' : '/landing/dashboard-snapshot-light-hd.webp'}
          alt="WQM dashboard showing Boat 01’s stored water-quality readings and measurement charts"
          width={2057}
          height={1157}
          sizes="(max-width: 768px) 100vw, 1152px"
          className="block h-auto w-full"
          draggable={false}
        />
      </ContainerScroll>
      <ScrollReveal className="mx-auto -mt-12 flex max-w-6xl flex-col items-center gap-5 px-6 pb-24 md:-mt-20">
        <p className="text-xs text-[var(--landing-muted)]">Dashboard overview · stored readings</p>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-[var(--landing-border)] px-6 py-3 text-sm hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4">Open dashboard <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </ScrollReveal>
    </section>
  );
}
