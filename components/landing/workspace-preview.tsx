import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';

export function WorkspacePreview() {
  return (
    <section id="workspace-preview" aria-labelledby="workspace-title" className="scroll-mt-24 overflow-hidden bg-stone-950 text-white">
      <ContainerScroll titleComponent={
        <>
          <p className="mb-5 text-sm text-stone-400">The monitoring workspace</p>
          <h2 id="workspace-title" className="text-balance font-serif text-4xl leading-tight md:text-6xl">From the river.<br />Into perspective.</h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-stone-300">Explore Boat 01’s water-quality readings, trends and location in one workspace.</p>
        </>
      }>
        <Image src="/landing/dashboard-snapshot.jpg" alt="WQM dashboard showing Boat 01’s pH, turbidity, dissolved oxygen, water temperature and measurement trends" fill sizes="(max-width: 768px) 100vw, 1152px" className="object-contain" draggable={false} />
      </ContainerScroll>
      <div className="mx-auto -mt-12 flex max-w-6xl flex-col items-center gap-5 px-6 pb-24 md:-mt-20">
        <p className="text-xs text-stone-400">Dashboard overview · stored readings</p>
        <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open dashboard <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
