export type TipoDocumento =
  | 'AUTORIZACAO_ANP'
  | 'CONTRATO_DISTRIBUIDORA'
  | 'ALVARA_FUNCIONAMENTO'
  | 'ALVARA_SANITARIO'
  | 'LICENCA_AMBIENTAL'
  | 'AVCB_BOMBEIROS'
  | 'INMETRO_IPEM'
  | 'CNPJ'
  | 'INSCRICAO_ESTADUAL'
  | 'FISPQ'
  | 'PARECER_TECNICO'
  | 'OUTORGA'
  | 'PLANTA_BAIXA'
  | 'FOTO_FACHADA';

export type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

export interface Documento {
  id: string;
  postoId: string;
  tipo: TipoDocumento;
  numero?: string;
  dataEmissao?: Date;
  dataVencimento?: Date;
  arquivoUrl?: string;
  status: StatusDocumento;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DocumentoRepository {
  listarPorPosto(postoId: string): Promise<Documento[]>;
  listarVencendoEm(dias: number): Promise<Documento[]>;
  salvar(documento: Documento): Promise<void>;
  buscarPorId(id: string): Promise<Documento | null>;
}
