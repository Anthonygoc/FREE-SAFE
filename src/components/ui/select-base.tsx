'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const selectBaseClassName =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20';

export const SelectBase = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select ref={ref} className={cn(selectBaseClassName, className)} {...props}>
        {children}
      </select>
    );
  },
);

SelectBase.displayName = 'SelectBase';

export const SelectInput = SelectBase;
