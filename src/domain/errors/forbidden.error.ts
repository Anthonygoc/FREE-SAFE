import { UnauthorizedError } from './domain.errors';

export class ForbiddenError extends UnauthorizedError {
  constructor(message = 'Você não tem permissão para acessar este recurso') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
