export interface CursoTreinamentoResumo {
  status: string;
  nota?: number;
  dataConclusao?: Date;
  certificadoUrl?: string;
}

export interface CursoComProgresso {
  id: string;
  nome: string;
  descricao?: string;
  cargaHoraria?: number;
  validadeDias?: number;
  cargosObrigatorios: string[];
  ativo: boolean;
  criadoEm: Date;
  totalConteudos: number;
  totalQuestoes: number;
  obrigatorio: boolean;
  treinamento?: CursoTreinamentoResumo;
}

export interface BuscarCursoComProgressoParams {
  colaboradorId?: string;
  cargo?: string;
}

export interface CursoRepository {
  listarAtivosComProgresso(params?: BuscarCursoComProgressoParams): Promise<CursoComProgresso[]>;
  buscarPorId(id: string): Promise<CursoComProgresso | null>;
  buscarPorIdComProgresso(id: string, params?: BuscarCursoComProgressoParams): Promise<CursoComProgresso | null>;
}
