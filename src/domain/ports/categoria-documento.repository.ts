export interface CategoriaDocumento {
  id: string;
  nome: string;
  descricao?: string;
  criadoEm: Date;
}

export interface CategoriaDocumentoRepository {
  listarTodas(): Promise<CategoriaDocumento[]>;
  buscarPorNome(nome: string): Promise<CategoriaDocumento | null>;
  buscarPorId(id: string): Promise<CategoriaDocumento | null>;
  salvar(categoria: CategoriaDocumento): Promise<void>;
}
