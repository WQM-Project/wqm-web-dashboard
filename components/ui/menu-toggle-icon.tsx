import { cn } from '@/lib/utils';

export function MenuToggleIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative block size-5', className)}>
      <span className={cn('absolute left-0 top-2 h-px w-5 bg-current transition-transform duration-200 motion-reduce:transition-none', open && 'translate-y-0.5 rotate-45')} />
      <span className={cn('absolute left-0 top-3 h-px w-5 bg-current transition-transform duration-200 motion-reduce:transition-none', open && '-translate-y-0.5 -rotate-45')} />
    </span>
  );
}
