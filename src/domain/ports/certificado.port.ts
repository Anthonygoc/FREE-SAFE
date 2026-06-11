export interface CertificadoProps {
  colaboradorNome: string;
  cargo: string;
  postoNome: string;
  postoCidade: string;
  postoUf: string;
  cursoNome: string;
  nota: number;
  dataConclusao: Date;
  codigoVerificacao: string;
}

export interface CertificadoPort {
  gerar(props: CertificadoProps): Promise<Buffer>;
}
