import { PrismaHero } from '@/components/ui/prisma-hero';
import { WorkspacePreview } from '@/components/landing/workspace-preview';
import { LandingThemeProvider } from '@/components/landing/landing-theme';
import { SmoothScroll } from '@/components/landing/smooth-scroll';
import { cookies } from 'next/headers';
import './landing.css';

export default async function LandingPreview() {
  const initialTheme = (await cookies()).get('wqm-theme')?.value === 'dark' ? 'dark' : 'light';
  return (
    <LandingThemeProvider initialTheme={initialTheme}>
    <SmoothScroll>
    <main>
      <PrismaHero />
      <WorkspacePreview />
    </main>
    </SmoothScroll>
    </LandingThemeProvider>
  );
}
