import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';

export interface Bico {
  id: string;
  bombaId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
  ativo: boolean;
  criadoEm: Date;
}

export interface Bomba {
  id: string;
  postoId: string;
  numero: number;
  modelo?: string;
  ativo: boolean;
  criadoEm: Date;
}

export interface BombaComBicos extends Bomba {
  bicos: Bico[];
}

export interface AtualizarBombaData {
  numero?: number;
  modelo?: string;
  ativo?: boolean;
}

export interface BombaRepository {
  listarPorPosto(postoId: string): Promise<BombaComBicos[]>;
  buscarPorId(id: string): Promise<Bomba | null>;
  buscarInativaPorNumero(postoId: string, numero: number): Promise<Bomba | null>;
  contarAfericoes(bombaId: string): Promise<number>;
  salvar(bomba: Bomba): Promise<void>;
  deletar(id: string): Promise<void>;
  excluirDefinitivo(bombaId: string): Promise<void>;
  reativar(bombaId: string): Promise<void>;
  atualizar(id: string, dados: AtualizarBombaData): Promise<void>;
}
