'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

export function HeroBackground() {
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function togglePlayback() {
    if (!video.current) return;
    if (video.current.paused) {
      void video.current.play().catch(() => setPlaying(false));
    } else {
      video.current.pause();
    }
  }

  return (
    <>
      <div className="absolute inset-0 -z-20">
        <Image src="/landing/river-team-clay-hero.png" alt="Clay miniature of friends testing a small RC boat beside a turquoise river, with mountains and soft clouds" fill priority sizes="100vw" className="object-cover object-[65%_center] md:object-center" />
        {mounted && reducedMotion === false && !failed && (
          <video ref={video} autoPlay loop muted playsInline preload="metadata" aria-hidden="true"
            className={`absolute inset-0 size-full object-cover object-[65%_center] transition-opacity duration-500 md:object-center ${ready ? 'opacity-100' : 'opacity-0'}`}
            onPlaying={() => { setReady(true); setPlaying(true); }} onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)} onError={() => setFailed(true)}>
            <source src="/landing/river-team-hero-loop-hq.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      {ready && !failed && reducedMotion === false && (
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause background animation' : 'Play background animation'}
          className="absolute right-5 top-20 z-10 flex size-9 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-fg)] opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 md:right-8">
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
