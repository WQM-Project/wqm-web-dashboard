'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useLandingTheme } from '@/components/landing/landing-theme';
import { SkyToggle } from '@/components/ui/sky-toggle';

const links = [
  { label: 'Our project', href: '#boat-scene' },
  { label: 'Workspace', href: '#workspace-preview' },
  { label: 'Features', href: '#features' },
  { label: 'Core team', href: '#core-team' },
  { label: 'Source code', href: 'https://github.com/WQM-Project' },
];

const MenuTitle = SheetTitle as ComponentType<{ className: string; children: ReactNode }>;

const MenuDescription = SheetDescription as ComponentType<{ className: string; children: ReactNode }>;

export function Header({ appearance = 'floating' }: { appearance?: 'floating' | 'notch' }) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useLandingTheme();
  const scrolled = useScroll(10);
  const menuButton = useRef<HTMLButtonElement>(null);



  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <header className={cn(
      'fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-40 px-4 text-[var(--landing-fg)] transition-transform duration-300 ease-out motion-reduce:transition-none md:top-4',
      scrolled && 'translate-y-2 md:translate-y-0',
    )}>
      <div className={cn(
        'mx-auto w-full max-w-4xl rounded-md border border-transparent transition-[border-radius,background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none',
        appearance === 'notch' && !scrolled && 'max-w-4xl rounded-t-none rounded-b-3xl bg-[var(--landing-panel)]',
        scrolled && 'rounded-2xl border-[var(--landing-border)] bg-[var(--landing-panel)] shadow-sm',
      )}>
        <nav aria-label="Main navigation" className="flex h-12 items-center justify-between gap-3 px-4">
          <a href="#boat-scene" aria-label="WQM home" className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4">
            <Image src="/branding/wqm-logo-with-background.png" alt="" width={28} height={28} className="rounded-full" />
            <span className="text-sm font-semibold">WQM</span>
          </a>
          <div className="ml-auto hidden items-center gap-1 md:flex">
            {links.map(link => (
              <a key={link.label} href={link.href} className={buttonVariants({ variant: 'ghost', className: 'text-[var(--landing-fg)] hover:bg-[var(--landing-border)] hover:text-[var(--landing-fg)] dark:hover:bg-[var(--landing-border)]' })}>
                {link.label}
              </a>
            ))}
            <Button asChild className="ml-3 bg-[var(--landing-button)] text-[var(--landing-button-text)] hover:bg-[var(--landing-button)] hover:text-[var(--landing-button-text)] hover:opacity-90">
              <Link href="/dashboard">Dashboard <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="ml-auto flex shrink-0 items-center md:ml-1">
            <SkyToggle dark={theme === 'dark'} onChange={toggle} />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
              <Button ref={menuButton} onClick={() => setOpen(true)} size="icon" variant="ghost" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={open} className="text-[var(--landing-fg)] hover:bg-[var(--landing-border)] hover:text-[var(--landing-fg)] dark:hover:bg-[var(--landing-border)] md:hidden">
                <MenuToggleIcon open={open} />
              </Button>
            <SheetContent data-theme={theme} side="right" onCloseAutoFocus={(event: Event) => { event.preventDefault(); menuButton.current?.focus(); }} className="wqm-landing w-full border-[var(--landing-border)] bg-[var(--landing-panel)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-[var(--landing-fg)] sm:max-w-none data-[state=open]:duration-200 data-[state=closed]:duration-200 motion-reduce:animate-none">
              <MenuTitle className="font-semibold text-[var(--landing-fg)]">WQM</MenuTitle>
              <MenuDescription className="sr-only">Explore the project, monitoring workspace and source code.</MenuDescription>
              <nav aria-label="Mobile navigation" className="mt-10 flex flex-col gap-2">
                {links.map(link => (
                  <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-4 text-xl hover:bg-[var(--landing-border)] focus-visible:outline-2">
                    {link.label}
                  </a>
                ))}
              </nav>
              <Button asChild className="mt-auto bg-[var(--landing-button)] text-[var(--landing-button-text)] hover:bg-[var(--landing-button)] hover:text-[var(--landing-button-text)] hover:opacity-90">
                <Link href="/dashboard" onClick={() => setOpen(false)}>Open dashboard <ArrowUpRight aria-hidden="true" /></Link>
              </Button>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
