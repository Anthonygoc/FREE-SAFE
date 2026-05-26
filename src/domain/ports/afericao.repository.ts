import type { Afericao } from '@/domain/entities/afericao.entity';

export interface AfericaoRepository {
  salvar(afericao: Afericao): Promise<void>;
  buscarPorId(id: string): Promise<Afericao | null>;
  listarPorPosto(postoId: string): Promise<Afericao[]>;
  listarPorBomba(postoId: string, bomba: number): Promise<Afericao[]>;
}
