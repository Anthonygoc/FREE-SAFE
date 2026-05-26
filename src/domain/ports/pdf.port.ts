import type { RAQ } from '@/domain/entities/raq.entity';
import type { Posto } from '@/domain/ports/posto.repository';

export interface PDFPort {
  gerarRAQ(raq: RAQ, posto: Posto): Promise<Buffer>;
}
