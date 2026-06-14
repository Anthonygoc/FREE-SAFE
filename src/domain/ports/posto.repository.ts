export interface Posto {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  gerenteId?: string | null;
  maxGerentes: number;
  maxAdministrativos: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface PostoRepository {
  listar(): Promise<Posto[]>;
  buscarPorId(id: string): Promise<Posto | null>;
  salvar(posto: Posto): Promise<void>;
  contar(): Promise<number>;
}
