import type { Afericao } from '@/domain/entities/afericao.entity';
import type { Posto } from '@/domain/ports/posto.repository';

export interface AfericaoPdfPort {
  gerarRelatorioLote(afericoes: Afericao[], posto: Posto): Promise<Buffer>;
}
