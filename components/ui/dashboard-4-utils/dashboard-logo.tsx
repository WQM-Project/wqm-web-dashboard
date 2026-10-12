import Image from 'next/image';
import { cn } from '@/lib/utils';

export function DashboardLogo({ theme, size = 48, className, decorative = false }: {
  theme: 'light' | 'dark'; size?: number; className?: string; decorative?: boolean;
}) {
  return <Image
    src={theme === 'dark' ? '/branding/wqm-logo-with-background.png' : '/branding/wqm-logo-transparent.png'}
    alt={decorative ? '' : 'WQM logo'}
    width={size} height={size}
    className={cn('shrink-0 object-contain', theme === 'dark' && 'rounded-lg bg-white', className)}
  />;
}
