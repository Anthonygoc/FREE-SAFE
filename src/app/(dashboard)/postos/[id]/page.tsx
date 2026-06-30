'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Info, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus, CardBase, FieldError, FieldLabel, IconBadge, InputBase, LoadingSpinner } from '@/components/ui';
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
  logoUrl: z.string().optional(),
  maxGerentes: z.coerce.number().int().min(0, 'Informe um valor maior ou igual a zero'),
  maxAdministrativos: z.coerce.number().int().min(0, 'Informe um valor maior ou igual a zero'),
  toleranciaInmetroMl: z.coerce.number().int().min(1, 'Informe um valor entre 1 e 1000').max(1000, 'Informe um valor entre 1 e 1000'),
});

type PostoFormValues = z.infer<typeof postoFormSchema>;

const readOnlyInputClassName = 'read-only:cursor-default read-only:bg-zinc-50 disabled:bg-zinc-50 disabled:text-zinc-500';
const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60';

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Falha ao carregar a logo'));
  reader.readAsDataURL(file);
});

export default function PostoDetalhePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postoId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: posto, isLoading, error } = usePosto(postoId);
  const updatePosto = useUpdatePosto();
  const podeEditar = session?.user?.perfil === 'ADMIN';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      logoUrl: '',
      maxGerentes: 0,
      maxAdministrativos: 0,
      toleranciaInmetroMl: 100,
    },
  });

  const logoPreview = watch('logoUrl');

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
      logoUrl: posto.logoUrl ?? '',
      maxGerentes: posto.maxGerentes,
      maxAdministrativos: posto.maxAdministrativos,
      toleranciaInmetroMl: posto.toleranciaInmetroMl,
    });
  }, [posto, reset]);

  async function handleSelecionarLogo(file?: File) {
    if (!file || !podeEditar) {
      return;
    }

    try {
      const logo = await toBase64(file);
      setValue('logoUrl', logo, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar a logo.');
    }
  }

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
      logoUrl: values.logoUrl || undefined,
      maxGerentes: values.maxGerentes,
      maxAdministrativos: values.maxAdministrativos,
      toleranciaInmetroMl: values.toleranciaInmetroMl,
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
  const previewAtual = logoPreview || posto.logoUrl || '';

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
              {previewAtual ? (
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <img
                    src={previewAtual}
                    alt={`Logo do posto ${posto.nome}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <IconBadge icon={Building2} tone="orange" size="lg" />
              )}
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
                <IconBadge icon={Building2} tone="orange" size="md" />
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Logo do posto</h2>
                  <p className="text-sm text-zinc-500">Usada na identificação visual e em futuras saídas do sistema.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                  {previewAtual ? (
                    <img
                      src={previewAtual}
                      alt={`Logo do posto ${posto.nome}`}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <div className="space-y-1 px-4 text-center">
                      <p className="text-sm font-medium text-zinc-700">Nenhuma logo cadastrada</p>
                      <p className="text-xs text-zinc-500">Envie uma imagem para personalizar este posto.</p>
                    </div>
                  )}
                </div>

                {podeEditar ? (
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                    Trocar logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleSelecionarLogo(event.target.files?.[0]);
                        event.target.value = '';
                      }}
                    />
                  </label>
                ) : (
                  <p className="text-sm text-zinc-500">Apenas ADMIN pode atualizar a logo do posto.</p>
                )}
              </div>
            </CardBase>

            <CardBase padding="lg" className="space-y-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={Info} tone="amber" size="md" />
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Parâmetros</h2>
                  <p className="text-sm text-zinc-500">Limites informativos esperados para a operação administrativa.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm leading-6 text-orange-950">
                      <p className="font-medium">Quantos perfis o posto deveria ter.</p>
                      <p className="mt-1">Valores de referência para a gestão. Não bloqueiam a criação de usuários.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor="toleranciaInmetroMl">Tolerância INMETRO (mL)</FieldLabel>
                  <InputBase
                    id="toleranciaInmetroMl"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    {...register('toleranciaInmetroMl')}
                    readOnly={bloqueado}
                    className={readOnlyInputClassName}
                  />
                  <FieldError>{errors.toleranciaInmetroMl?.message}</FieldError>
                  <p className="mt-1 text-xs text-zinc-500">
                    Limite aceitável para mais ou para menos na aferição (padrão: 100 mL). Afeta apenas novas aferições.
                  </p>
                </div>

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
