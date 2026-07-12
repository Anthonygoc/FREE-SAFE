import type { Bico } from '@/domain/ports/bomba.repository';

export interface BicoRepository {
  listarPorBomba(bombaId: string, incluirInativos?: boolean): Promise<Bico[]>;
  buscarPorId(id: string): Promise<Bico | null>;
  buscarPorNumeroDaBomba(bombaId: string, numero: number): Promise<Bico | null>;
  buscarInativoPorNumero(bombaId: string, numero: number): Promise<Bico | null>;
  salvar(bico: Bico): Promise<void>;
  deletar(id: string): Promise<void>;
  excluirDefinitivo(id: string): Promise<void>;
  desativar(id: string): Promise<void>;
  reativar(id: string): Promise<void>;
  contarAfericoes(bicoId: string): Promise<number>;
}
