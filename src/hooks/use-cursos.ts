'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

type StatusTreinamento = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
type AlternativaResposta = 'A' | 'B' | 'C' | 'D';
type TipoConteudo = 'TEXTO_RICO' | 'VIDEO_YOUTUBE' | 'PDF_TEXTO';

export interface CursoTreinamento {
  status: 'CONCLUIDO' | 'EM_ANDAMENTO';
  nota?: number;
  dataConclusao?: string;
  certificadoUrl?: string;
}

export interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  cargaHoraria?: number;
  validadeDias?: number;
  cargosObrigatorios: string[];
  totalConteudos: number;
  totalQuestoes: number;
  obrigatorio: boolean;
  treinamento?: CursoTreinamento;
  status?: StatusTreinamento;
  progresso?: number;
  nota?: number;
}

export interface CursoConteudo {
  id: string;
  ordem: number;
  titulo: string;
  tipo: TipoConteudo;
  conteudo: string;
}

export interface CursoConteudoResponse {
  curso: {
    id: string;
    nome: string;
    descricao?: string;
  };
  conteudos: CursoConteudo[];
}

export interface CursoQuestao {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: Record<AlternativaResposta, string>;
}

export interface SubmitProvaInput {
  cursoId: string;
  colaboradorId?: string;
  respostas: Array<{
    questaoId: string;
    resposta: AlternativaResposta;
  }>;
}

export interface SubmitProvaOutput {
  attemptId: string;
  nota: number;
  aprovado: boolean;
  acertos: number;
  total: number;
}

export interface ResultadoProva {
  tentativas: number;
  melhorNota: number;
  aprovado: boolean;
  ultimoAttemptId: string;
}

export function useCursos() {
  return useQuery({
    queryKey: ['cursos'],
    queryFn: () => apiClient.get<Curso[]>('/api/cursos'),
  });
}

export function useCursoConteudo(cursoId?: string) {
  return useQuery({
    queryKey: ['cursos', cursoId, 'conteudo'],
    queryFn: () => apiClient.get<CursoConteudoResponse>(`/api/cursos/${cursoId}/conteudo`),
    enabled: !!cursoId,
  });
}

export function useCursoQuestoes(cursoId?: string) {
  return useQuery({
    queryKey: ['cursos', cursoId, 'questoes'],
    queryFn: () => apiClient.get<CursoQuestao[]>(`/api/cursos/${cursoId}/questoes`),
    enabled: !!cursoId,
  });
}

export function useSubmitProva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, colaboradorId, respostas }: SubmitProvaInput) => {
      const searchParams = new URLSearchParams();
      if (colaboradorId) {
        searchParams.set('colaboradorId', colaboradorId);
      }

      const query = searchParams.toString();
      const path = query
        ? `/api/cursos/${cursoId}/prova?${query}`
        : `/api/cursos/${cursoId}/prova`;

      return apiClient.post<SubmitProvaOutput>(path, { respostas });
    },
    onSuccess: (output, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['cursos', variables.cursoId, 'resultado'] });
      toast.success(`Prova enviada. Nota ${output.nota}% • ${output.aprovado ? 'Aprovado' : 'Reprovado'}.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar prova.');
    },
  });
}

export function useResultadoProva(cursoId?: string, colaboradorId?: string) {
  return useQuery({
    queryKey: ['cursos', cursoId, 'resultado', colaboradorId ?? 'self'],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (colaboradorId) {
        searchParams.set('colaboradorId', colaboradorId);
      }

      const query = searchParams.toString();
      const path = query
        ? `/api/cursos/${cursoId}/prova/resultado?${query}`
        : `/api/cursos/${cursoId}/prova/resultado`;

      return apiClient.get<ResultadoProva | null>(path);
    },
    enabled: !!cursoId,
  });
}
