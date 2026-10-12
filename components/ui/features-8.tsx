'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Database, Droplets, FlaskConical, Gauge, MapPin, RadioTower, Ship, ShieldCheck, Wind } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal, ScrollText } from '@/components/ui/text-scroll-animation';
import { cn } from '@/lib/utils';

const cardStyle = 'h-full overflow-hidden rounded-3xl border-[var(--landing-border)] bg-[var(--landing-panel)] text-[var(--landing-fg)] shadow-none';
const muted = 'text-sm leading-relaxed text-[var(--landing-muted)]';
const control = 'rounded-full border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2';
const stages = [
  { title: 'On the boat', icon: Ship, detail: 'The STM32 node packages sensor readings into JSON. Boat and radio integration is the next hardware stage.' },
  { title: 'To the shore', icon: RadioTower, detail: 'The planned LoRa link carries the packet to the shore gateway. Only the gateway needs mobile internet.' },
  { title: 'Into storage', icon: Database, detail: 'Cellular HTTPS uploads have been tested. The backend saves each packet once and acknowledges a retry without creating a duplicate.' },
];
const analysis = [
  { label: 'Classification', title: 'A clearer picture of water quality.', detail: 'The ML repository includes an XGBoost pipeline for four quality classes: Excellent, Good, Poor and Dangerous. Dashboard integration is still to come.', tags: ['Excellent', 'Good', 'Poor', 'Dangerous'] },
  { label: 'Anomalies', title: 'Look beyond a single number.', detail: 'Threshold rules and an Isolation Forest check for unusual readings and combinations of measurements. These are analysis tools, not a water-safety certification.', tags: ['Threshold rules', 'Isolation Forest'] },
  { label: 'Forecasts', title: 'Understand where the trend is heading.', detail: 'Time-series forecasting with Prophet is planned for the next phase. Forecasts and automatic alerts are not yet available in the workspace.', tags: ['In development'] },
];
const workspaceTools = ['Trends', 'Location', 'Packets'] as const;
const sensorGroups = [
  { label: 'Water', icon: Droplets, measurements: ['pH', 'Dissolved oxygen', 'Turbidity', 'Dissolved solids', 'Conductivity', 'Redox potential', 'Temperature'] },
  { label: 'Depth', icon: Gauge, measurements: ['Water depth'] },
  { label: 'Weather', icon: Wind, measurements: ['Air temperature', 'Humidity', 'Pressure'] },
];

export function Features() {
  const [sensorIndex, setSensorIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [tool, setTool] = useState<typeof workspaceTools[number]>('Trends');
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const selectedSensors = sensorGroups[sensorIndex];
  const SensorIcon = selectedSensors.icon;
  const selectedAnalysis = analysis[analysisIndex];

  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 overflow-hidden bg-[var(--landing-bg)] px-6 py-12 text-[var(--landing-fg)] md:py-16">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="mb-5 text-sm text-[var(--landing-muted)]">What we’re building</p>
          <h2 id="features-title" className="text-balance font-serif text-4xl leading-tight md:text-6xl"><ScrollText text="One boat. A wider view." spread={3} /></h2>
          <p className="mt-6 text-pretty leading-relaxed text-[var(--landing-muted)]">From measurements on the river to a workspace on shore. Explore the pieces that make WQM work.</p>
        </ScrollReveal>

        <div className="grid grid-cols-6 gap-4">
          <ScrollReveal className="col-span-6 sm:col-span-3 lg:col-span-2">
            <Card className={cardStyle}><CardContent className="flex h-full flex-col p-6">
              <div className="relative mb-6 flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-[var(--landing-bg)]" aria-hidden="true">
                <svg viewBox="0 0 320 144" preserveAspectRatio="none" className="absolute inset-0 size-full text-[var(--landing-border)]">
                  <path d="M-20 110 Q60 55 160 100 T340 90 M-20 128 Q70 72 170 118 T340 108 M-20 145 Q80 92 180 138 T340 127" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <ellipse cx="160" cy="72" rx="65" ry="40" fill="none" stroke="currentColor" transform="rotate(-14 160 72)" />
                  <ellipse cx="160" cy="72" rx="85" ry="55" fill="none" stroke="currentColor" transform="rotate(-14 160 72)" />
                </svg>
                <div className="relative flex size-20 items-center justify-center rounded-full bg-[var(--landing-panel)]"><SensorIcon className="size-9 stroke-1" /></div>
              </div>
              <h3 className="text-xl font-medium">A fuller picture of the river.</h3>
              <p className={cn(muted, 'mt-2')}>Onboard sensing brings water chemistry, depth and weather into the same picture.</p>
              <div className="mb-4 mt-5 flex flex-wrap gap-2" aria-label="Explore onboard sensing">
                {sensorGroups.map((group, index) => <button key={group.label} type="button" aria-pressed={sensorIndex === index} onClick={() => setSensorIndex(index)} className={cn(control, sensorIndex === index ? 'border-[var(--landing-fg)] bg-[var(--landing-fg)] text-[var(--landing-bg)]' : 'border-[var(--landing-border)]')}>{group.label}</button>)}
              </div>
              <div aria-live="polite" aria-label={`${selectedSensors.label} measurements`} className="flex min-h-24 flex-wrap content-start gap-x-3 gap-y-2 text-xs text-[var(--landing-muted)]">
                {selectedSensors.measurements.map((measurement) => <span key={measurement} className="inline-flex items-center gap-1.5"><span className="size-1 rounded-full bg-current opacity-50" aria-hidden="true" />{measurement}</span>)}
              </div>
            </CardContent></Card>
          </ScrollReveal>

          <ScrollReveal className="col-span-6 sm:col-span-3 lg:col-span-2">
            <Card className={cardStyle}><CardContent className="flex h-full flex-col p-6">
              <div className="relative mx-auto mb-7 flex size-28 items-center justify-center rounded-full border border-[var(--landing-border)] before:absolute before:-inset-3 before:rounded-full before:border before:border-[var(--landing-border)]"><RadioTower className="size-12 stroke-1" aria-hidden="true" /></div>
              <h3 className="text-xl font-medium">A link back to shore.</h3>
              <p className={cn(muted, 'mt-2')}>LoRa is designed to relay small packets from the boat to a gateway, without Wi-Fi on the water.</p>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--landing-bg)] p-4 text-xs"><Ship className="size-5" aria-hidden="true" /><span>Boat</span><ArrowRight className="size-4" aria-hidden="true" /><span>Shore</span><RadioTower className="size-5" aria-hidden="true" /></div>
              <p className="mt-4 text-xs text-[var(--landing-muted)]">Hardware integration in progress</p>
              <a href="https://github.com/WQM-Project/edge-sensing-node" target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm underline-offset-4 hover:underline focus-visible:outline-2">Explore the sensing node <ArrowUpRight className="size-4" aria-hidden="true" /></a>
            </CardContent></Card>
          </ScrollReveal>

          <ScrollReveal className="col-span-6 lg:col-span-2">
            <Card className={cardStyle}><CardContent className="flex h-full flex-col p-6">
              <div className="mb-5 flex flex-wrap gap-2" aria-label="Workspace preview tools">
                {workspaceTools.map((item) => <button key={item} type="button" aria-pressed={tool === item} onClick={() => setTool(item)} className={cn(control, tool === item ? 'border-[var(--landing-fg)] bg-[var(--landing-fg)] text-[var(--landing-bg)]' : 'border-[var(--landing-border)]')}>{item}</button>)}
              </div>
              <div className="mb-5 flex min-h-32 items-center justify-center rounded-2xl bg-[var(--landing-bg)] p-4" aria-hidden="true">
                {tool === 'Trends' && <svg viewBox="0 0 240 100" className="w-full"><path d="M0 80H240M0 45H240M0 10H240" stroke="var(--landing-border)" fill="none" /><path d="M2 70L22 65L42 72L62 48L82 55L102 38L122 44L142 22L162 30L182 15L202 25L222 10L238 18" stroke="currentColor" strokeWidth="2" fill="none" /></svg>}
                {tool === 'Location' && <MapPin className="size-16 stroke-1" />}
                {tool === 'Packets' && <div className="w-full space-y-2 font-mono text-xs"><p>{'{ "id": "WQM-001",'}</p><p className="pl-3">"pH": …,</p><p className="pl-3">"turb_ntu": …</p><p>{'}'}</p></div>}
              </div>
              <div aria-live="polite"><h3 className="text-xl font-medium">{tool === 'Trends' ? 'Read the river over time.' : tool === 'Location' ? 'Put readings in context.' : 'See what arrived.'}</h3><p className={cn(muted, 'mt-2')}>{tool === 'Trends' ? 'Choose a measurement and a time window. Inspect stored readings or take them with you as a CSV.' : tool === 'Location' ? 'Explore the boat map in normal, satellite, terrain or hybrid view. Real GPS integration is still to come.' : 'Inspect the original packet and its recorded measurements, with separate workspace readings and gateway history.'}</p></div>
              <Link href="/dashboard" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm underline-offset-4 hover:underline focus-visible:outline-2">Open the workspace <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
            </CardContent></Card>
          </ScrollReveal>

          <ScrollReveal className="col-span-6 lg:col-span-3">
            <Card className={cardStyle}><CardContent className="p-6 sm:p-8">
              <ShieldCheck className="mb-5 size-8 stroke-1" aria-hidden="true" />
              <h3 className="text-xl font-medium">One packet. One saved record.</h3>
              <p className={cn(muted, 'mt-2')}>A cellular connection carries the upload over verified HTTPS. Retrying the same packet does not duplicate it.</p>
              <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Explore the packet journey">
                {stages.map((item, index) => <button type="button" key={item.title} onClick={() => setStage(index)} aria-pressed={stage === index} className={cn('flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs focus-visible:outline-2 focus-visible:outline-offset-2', stage === index ? 'border-[var(--landing-fg)] bg-[var(--landing-bg)]' : 'border-[var(--landing-border)]')}><item.icon className="size-5 stroke-1" aria-hidden="true" />{item.title}</button>)}
              </div>
              <p className={cn(muted, 'mt-4 min-h-20')} aria-live="polite">{stages[stage].detail}</p>
              <p className="mt-3 flex items-center gap-2 text-xs"><Check className="size-4" aria-hidden="true" />Cellular upload and duplicate handling tested</p>
            </CardContent></Card>
          </ScrollReveal>

          <ScrollReveal className="col-span-6 lg:col-span-3">
            <Card className={cardStyle}><CardContent className="p-6 sm:p-8">
              <FlaskConical className="mb-5 size-8 stroke-1" aria-hidden="true" />
              <div className="mb-5 flex flex-wrap gap-2" aria-label="Explore analysis capabilities">
                {analysis.map((item, index) => <button key={item.label} type="button" aria-pressed={analysisIndex === index} onClick={() => setAnalysisIndex(index)} className={cn(control, analysisIndex === index ? 'border-[var(--landing-fg)] bg-[var(--landing-fg)] text-[var(--landing-bg)]' : 'border-[var(--landing-border)]')}>{item.label}</button>)}
              </div>
              <div aria-live="polite"><h3 className="text-xl font-medium">{selectedAnalysis.title}</h3><p className={cn(muted, 'mt-2 min-h-24')}>{selectedAnalysis.detail}</p><div className="mt-5 flex flex-wrap gap-2">{selectedAnalysis.tags.map((tag) => <span key={tag} className="rounded-lg border border-[var(--landing-border)] px-3 py-2 text-xs">{tag}</span>)}</div></div>
              <a href="https://github.com/WQM-Project/water-quality-ml" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline focus-visible:outline-2">Explore the analysis <ArrowUpRight className="size-4" aria-hidden="true" /></a>
            </CardContent></Card>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
