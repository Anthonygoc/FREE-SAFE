'use client';

export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-orange-200 border-t-orange-500"
      style={{ width: size, height: size }}
      aria-label="Carregando"
    />
  );
}
