export type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

export interface Documento {
  id: string;
  postoId: string;
  categoriaId: string;
  titulo: string;
  numero?: string;
  dataEmissao?: Date;
  dataVencimento?: Date;
  arquivoUrl?: string;
  status: StatusDocumento;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DocumentoComCategoria extends Documento {
  categoriaNome: string;
  postoNome: string;
}

export interface ListarDocumentosPorIntervaloVencimentoInput {
  postoId?: string;
  inicio: Date;
  fim: Date;
}

export interface DocumentoRepository {
  listarPorPosto(postoId: string): Promise<DocumentoComCategoria[]>;
  listarVencendoEm(dias: number): Promise<DocumentoComCategoria[]>;
  listarPorIntervaloVencimento(
    input: ListarDocumentosPorIntervaloVencimentoInput,
  ): Promise<DocumentoComCategoria[]>;
  salvar(documento: Documento): Promise<void>;
  buscarPorId(id: string): Promise<Documento | null>;
  deletar(id: string): Promise<void>;
}
