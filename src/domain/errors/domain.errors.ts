export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class CampoObrigatorioError extends DomainError {
  constructor(campo: string) {
    super(`Campo obrigatório ausente: ${campo}`);
    this.name = 'CampoObrigatorioError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Não autorizado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
