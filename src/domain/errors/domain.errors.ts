export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class CampoObrigatorioError extends DomainError {
  constructor(campo: string) {
    super(`O campo "${campo}" é obrigatório.`);
    this.name = 'CampoObrigatorioError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Sua sessão expirou. Faça login novamente.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Você não tem permissão para esta ação') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Registro não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}
