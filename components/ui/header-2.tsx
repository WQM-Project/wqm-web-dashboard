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

const links = [
  { label: 'The boat', href: '#boat-scene' },
  { label: 'Workspace', href: '#workspace-preview' },
  { label: 'Source code', href: 'https://github.com/WQM-Project' },
];

const MenuTitle = SheetTitle as ComponentType<{ className: string; children: ReactNode }>;

const MenuDescription = SheetDescription as ComponentType<{ className: string; children: ReactNode }>;

export function Header({ appearance = 'floating' }: { appearance?: 'floating' | 'notch' }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScroll(10);
  const menuButton = useRef<HTMLButtonElement>(null);



  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <header className={cn('fixed inset-x-0 z-40 px-4 text-white', appearance === 'notch' && !scrolled ? 'top-[max(0.5rem,env(safe-area-inset-top))] md:top-4' : 'top-[max(1rem,env(safe-area-inset-top))]')}>
      <div className={cn(
        'mx-auto w-full max-w-5xl rounded-md border border-transparent',
        appearance === 'notch' && !scrolled && 'max-w-4xl rounded-t-none rounded-b-3xl bg-stone-950',
        scrolled && 'max-w-4xl border-white/15 bg-stone-950/90 shadow-md',
      )}>
        <nav aria-label="Main navigation" className="flex h-16 items-center justify-between gap-4 px-4 md:h-14">
          <a href="#boat-scene" aria-label="WQM home" className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4">
            <Image src="/branding/wqm-logo-with-background.png" alt="" width={32} height={32} className="rounded-full" />
            <span className="font-semibold">WQM</span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {links.map(link => (
              <a key={link.label} href={link.href} className={buttonVariants({ variant: 'ghost', className: 'text-white/90 hover:bg-white/10 hover:text-white' })}>
                {link.label}
              </a>
            ))}
            <Button asChild className="ml-3 bg-white text-stone-950 hover:bg-white/90">
              <Link href="/dashboard">Dashboard <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
              <Button ref={menuButton} onClick={() => setOpen(true)} size="icon" variant="ghost" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={open} className="text-white hover:bg-white/10 hover:text-white md:hidden">
                <MenuToggleIcon open={open} />
              </Button>
            <SheetContent side="right" onCloseAutoFocus={(event: Event) => { event.preventDefault(); menuButton.current?.focus(); }} className="w-full border-white/15 bg-stone-950 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-white sm:max-w-none data-[state=open]:duration-200 data-[state=closed]:duration-200 motion-reduce:animate-none">
              <MenuTitle className="font-semibold text-white">WQM</MenuTitle>
              <MenuDescription className="sr-only">Explore the boat, readings and project source code.</MenuDescription>
              <nav aria-label="Mobile navigation" className="mt-10 flex flex-col gap-2">
                {links.map(link => (
                  <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-4 text-xl hover:bg-white/10 focus-visible:outline-2">
                    {link.label}
                  </a>
                ))}
              </nav>
              <Button asChild className="mt-auto bg-white text-stone-950 hover:bg-white/90">
                <Link href="/dashboard" onClick={() => setOpen(false)}>Open dashboard <ArrowUpRight aria-hidden="true" /></Link>
              </Button>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
