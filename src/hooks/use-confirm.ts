'use client';

import { createElement, useCallback, useMemo, useRef, useState } from 'react';

import { ConfirmDialog, type ConfirmDialogProps } from '@/components/ui/confirm-dialog';

type ConfirmOptions = Omit<ConfirmDialogProps, 'aberto' | 'carregando' | 'onConfirmar' | 'onCancelar'>;

export function useConfirm() {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const fechar = useCallback((value: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolver?.(value);
  }, []);

  const confirmar = useCallback((nextOptions: ConfirmOptions) => {
    if (resolverRef.current) {
      resolverRef.current(false);
    }

    setOptions(nextOptions);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const ConfirmDialogElement = useMemo(() => createElement(ConfirmDialog, {
    aberto: options !== null,
    titulo: options?.titulo ?? '',
    descricao: options?.descricao,
    textoConfirmar: options?.textoConfirmar,
    textoCancelar: options?.textoCancelar,
    severidade: options?.severidade,
    onConfirmar: () => fechar(true),
    onCancelar: () => fechar(false),
  }), [fechar, options]);

  return {
    confirmar,
    ConfirmDialogElement,
  };
}
