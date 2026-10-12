'use client';

import Image from 'next/image';
import { Globe, Linkedin, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal, ScrollText } from '@/components/ui/text-scroll-animation';
import { coreTeam } from '@/components/landing/team-data';

export default function CoreTeam() {
  return (
    <section id="core-team" aria-labelledby="team-title" className="scroll-mt-24 bg-[var(--landing-bg)] px-6 py-12 text-[var(--landing-fg)] md:py-16">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-5 text-center md:mb-10">
          <Badge variant="outline" className="rounded-full border-[var(--landing-border)] px-3 py-1 text-[var(--landing-fg)]">Core team</Badge>
          <h2 id="team-title" className="text-balance font-serif text-4xl leading-tight md:text-6xl"><ScrollText text="The people behind WQM." spread={3} /></h2>
          <p className="text-pretty text-base leading-relaxed text-[var(--landing-muted)]">Six people, bringing the boat, sensors and workspace together.</p>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-12">
          {coreTeam.map((member) => {
            const name = member.name || `Team member ${member.id}`;
            return (
              <ScrollReveal key={member.id} className="group w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                <article className="flex flex-col items-center gap-5">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-panel)]">
                    {member.image ? (
                      <Image src={member.image} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" className="object-cover transition-[filter] duration-300 group-hover:grayscale motion-reduce:transition-none" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 text-[var(--landing-muted)]">
                        <UserRound className="size-16 stroke-1 opacity-40" aria-hidden="true" />
                        <span className="text-xs">Photo to be added</span>
                        <span className="absolute left-4 top-4 font-mono text-xs opacity-60" aria-hidden="true">{member.id}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-medium">{name}</h3>
                    <p className="mt-2 text-sm text-[var(--landing-muted)]">{member.role || 'Role to be added'}</p>
                  </div>
                  {(member.website || member.linkedin) && (
                    <div className="flex gap-2">
                      {member.website && <a href={member.website} aria-label={`${name}'s website`} target="_blank" rel="noopener noreferrer" className="rounded-full p-3 hover:bg-[var(--landing-panel)] focus-visible:outline-2 focus-visible:outline-offset-2"><Globe className="size-4" aria-hidden="true" /></a>}
                      {member.linkedin && <a href={member.linkedin} aria-label={`${name}'s LinkedIn`} target="_blank" rel="noopener noreferrer" className="rounded-full p-3 hover:bg-[var(--landing-panel)] focus-visible:outline-2 focus-visible:outline-offset-2"><Linkedin className="size-4" aria-hidden="true" /></a>}
                    </div>
                  )}
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
