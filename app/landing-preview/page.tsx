import { PrismaHero } from '@/components/ui/prisma-hero';
import { WorkspacePreview } from '@/components/landing/workspace-preview';
import { LandingThemeProvider } from '@/components/landing/landing-theme';
import { cookies } from 'next/headers';
import './landing.css';

export default async function LandingPreview() {
  const initialTheme = (await cookies()).get('wqm-theme')?.value === 'dark' ? 'dark' : 'light';
  return (
    <LandingThemeProvider initialTheme={initialTheme}>
    <main>
      <PrismaHero />
      <WorkspacePreview />
    </main>
    </LandingThemeProvider>
  );
}
