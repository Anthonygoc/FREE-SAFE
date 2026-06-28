'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Info, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus, CardBase, FieldError, FieldLabel, IconBadge, InputBase, LoadingSpinner } from '@/components/ui';
import { podeAcessar } from '@/domain/permissions/permissions';
import { usePosto, useUpdatePosto } from '@/hooks/use-postos';

const pageAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
} as const;

const postoFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do posto').max(100, 'Máximo de 100 caracteres'),
  razaoSocial: z.string().trim().min(1, 'Informe a razão social').max(200, 'Máximo de 200 caracteres'),
  inscricaoEstadual: z.string().trim().max(30, 'Máximo de 30 caracteres'),
  endereco: z.string().trim().min(1, 'Informe o endereço').max(300, 'Máximo de 300 caracteres'),
  cidade: z.string().trim().min(1, 'Informe a cidade').max(100, 'Máximo de 100 caracteres'),
  uf: z.string().trim().length(2, 'UF deve ter 2 caracteres').transform((value) => value.toUpperCase()),
  maxGerentes: z.coerce.number().int().min(0, 'Informe um valor maior ou igual a zero'),
  maxAdministrativos: z.coerce.number().int().min(0, 'Informe um valor maior ou igual a zero'),
});

type PostoFormValues = z.infer<typeof postoFormSchema>;

const readOnlyInputClassName = 'read-only:cursor-default read-only:bg-zinc-50 disabled:bg-zinc-50 disabled:text-zinc-500';
const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60';

export default function PostoDetalhePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postoId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: posto, isLoading, error } = usePosto(postoId);
  const updatePosto = useUpdatePosto();
  const podeEditar = podeAcessar(
    (session?.user?.perfil ?? 'COLABORADOR') as Parameters<typeof podeAcessar>[0],
    'postos',
    'editar',
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof postoFormSchema>, unknown, PostoFormValues>({
    resolver: zodResolver(postoFormSchema),
    defaultValues: {
      nome: '',
      razaoSocial: '',
      inscricaoEstadual: '',
      endereco: '',
      cidade: '',
      uf: '',
      maxGerentes: 0,
      maxAdministrativos: 0,
    },
  });

  useEffect(() => {
    if (!posto) {
      return;
    }

    reset({
      nome: posto.nome,
      razaoSocial: posto.razaoSocial,
      inscricaoEstadual: posto.inscricaoEstadual ?? '',
      endereco: posto.endereco,
      cidade: posto.cidade,
      uf: posto.uf,
      maxGerentes: posto.maxGerentes,
      maxAdministrativos: posto.maxAdministrativos,
    });
  }, [posto, reset]);

  async function onSubmit(values: PostoFormValues) {
    if (!posto || !podeEditar) {
      return;
    }

    await updatePosto.mutateAsync({
      id: posto.id,
      nome: values.nome.trim(),
      razaoSocial: values.razaoSocial.trim(),
      inscricaoEstadual: values.inscricaoEstadual.trim() || null,
      endereco: values.endereco.trim(),
      cidade: values.cidade.trim(),
      uf: values.uf.trim().toUpperCase(),
      maxGerentes: values.maxGerentes,
      maxAdministrativos: values.maxAdministrativos,
    });
  }

  if (isLoading) {
    return (
      <RouteGuard recurso="postos">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard recurso="postos">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/postos')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a lista
          </button>
          <CardBase className="border-red-200 bg-red-50/70">
            <p className="text-sm text-red-700">
              {error instanceof Error ? error.message : 'Não foi possível carregar este posto.'}
            </p>
          </CardBase>
        </div>
      </RouteGuard>
    );
  }

  if (!posto) {
    return (
      <RouteGuard recurso="postos">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/postos')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a lista
          </button>
          <CardBase>
            <p className="text-sm text-zinc-500">Posto não encontrado.</p>
          </CardBase>
        </div>
      </RouteGuard>
    );
  }

  const bloqueado = !podeEditar || updatePosto.isPending;

  return (
    <RouteGuard recurso="postos">
      <motion.div {...pageAnimation} className="space-y-6">
        <button
          type="button"
          onClick={() => router.push('/postos')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista
        </button>

        <CardBase padding="lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <IconBadge icon={Building2} tone="orange" size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{posto.nome}</h1>
                  <BadgeStatus label={posto.ativo ? 'Ativo' : 'Inativo'} tone={posto.ativo ? 'green' : 'red'} />
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Ajuste os dados cadastrais e os parâmetros informativos deste posto.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              {podeEditar
                ? 'Você pode editar e salvar as configurações deste posto.'
                : 'Visualização somente leitura. Apenas ADMIN pode editar as configurações do posto.'}
            </div>
          </div>
        </CardBase>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <CardBase padding="lg" className="space-y-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={Building2} tone="orange" size="md" />
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Dados do posto</h2>
                <p className="text-sm text-zinc-500">Informações cadastrais e fiscais exibidas no sistema.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel htmlFor="nome">Nome do posto</FieldLabel>
                <InputBase id="nome" {...register('nome')} readOnly={bloqueado} className={readOnlyInputClassName} />
                <FieldError>{errors.nome?.message}</FieldError>
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="razaoSocial">Razão social</FieldLabel>
                <InputBase id="razaoSocial" {...register('razaoSocial')} readOnly={bloqueado} className={readOnlyInputClassName} />
                <FieldError>{errors.razaoSocial?.message}</FieldError>
              </div>

              <div>
                <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
                <InputBase id="cnpj" value={posto.cnpj} readOnly disabled className={readOnlyInputClassName} />
                <p className="mt-1 text-xs text-zinc-500">Campo imutável por ser o identificador fiscal único do posto.</p>
              </div>

              <div>
                <FieldLabel htmlFor="inscricaoEstadual">Inscrição estadual</FieldLabel>
                <InputBase id="inscricaoEstadual" {...register('inscricaoEstadual')} readOnly={bloqueado} className={readOnlyInputClassName} />
                <FieldError>{errors.inscricaoEstadual?.message}</FieldError>
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="endereco">Endereço</FieldLabel>
                <InputBase id="endereco" {...register('endereco')} readOnly={bloqueado} className={readOnlyInputClassName} />
                <FieldError>{errors.endereco?.message}</FieldError>
              </div>

              <div>
                <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                <InputBase id="cidade" {...register('cidade')} readOnly={bloqueado} className={readOnlyInputClassName} />
                <FieldError>{errors.cidade?.message}</FieldError>
              </div>

              <div>
                <FieldLabel htmlFor="uf">UF</FieldLabel>
                <InputBase id="uf" maxLength={2} {...register('uf')} readOnly={bloqueado} className={`${readOnlyInputClassName} uppercase`} />
                <FieldError>{errors.uf?.message}</FieldError>
              </div>
            </div>
          </CardBase>

          <div className="space-y-6">
            <CardBase padding="lg" className="space-y-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={Info} tone="amber" size="md" />
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Parâmetros</h2>
                  <p className="text-sm text-zinc-500">Limites informativos esperados para a operação administrativa.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm leading-6 text-orange-950">
                <p className="font-medium">`maxGerentes` e `maxAdministrativos` são informativos.</p>
                <p className="mt-1">Use estes valores para registrar quantos perfis o posto deveria ter, mesmo que a validação automática ainda não consuma esses campos.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor="maxGerentes">Máximo de gerentes</FieldLabel>
                  <InputBase
                    id="maxGerentes"
                    type="number"
                    min={0}
                    step={1}
                    {...register('maxGerentes')}
                    readOnly={bloqueado}
                    className={readOnlyInputClassName}
                  />
                  <FieldError>{errors.maxGerentes?.message}</FieldError>
                </div>

                <div>
                  <FieldLabel htmlFor="maxAdministrativos">Máximo de administrativos</FieldLabel>
                  <InputBase
                    id="maxAdministrativos"
                    type="number"
                    min={0}
                    step={1}
                    {...register('maxAdministrativos')}
                    readOnly={bloqueado}
                    className={readOnlyInputClassName}
                  />
                  <FieldError>{errors.maxAdministrativos?.message}</FieldError>
                </div>
              </div>
            </CardBase>

            <CardBase padding="lg" className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Atualização</h2>
                <p className="mt-1 text-sm text-zinc-500">Última atualização em {new Date(posto.atualizadoEm).toLocaleString('pt-BR')}.</p>
              </div>

              {podeEditar ? (
                <button
                  type="submit"
                  disabled={updatePosto.isPending || !isDirty}
                  className={primaryButtonClassName}
                >
                  {updatePosto.isPending ? <LoadingSpinner size={16} /> : <Save className="h-4 w-4" />}
                  {updatePosto.isPending ? 'Salvando...' : 'Salvar configurações'}
                </button>
              ) : null}
            </CardBase>
          </div>
        </form>
      </motion.div>
    </RouteGuard>
  );
}
