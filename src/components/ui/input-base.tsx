'use client';

import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const inputBaseClassName =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-zinc-400';

export const InputBase = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(inputBaseClassName, className)} {...props} />;
  },
);

InputBase.displayName = 'InputBase';

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(inputBaseClassName, className)} {...props} />;
  },
);

TextareaInput.displayName = 'TextareaInput';

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-zinc-700', className)} {...props} />;
}

type FieldErrorProps = {
  children?: ReactNode;
  className?: string;
};

export function FieldError({ children, className }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return <p className={cn('mt-1 text-xs text-red-600', className)}>{children}</p>;
}

export const TextInput = InputBase;
