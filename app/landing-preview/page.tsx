import { PrismaHero } from '@/components/ui/prisma-hero';
import { WorkspacePreview } from '@/components/landing/workspace-preview';

export default function LandingPreview() {
  return (
    <main>
      <PrismaHero />
      <WorkspacePreview />
    </main>
  );
}
