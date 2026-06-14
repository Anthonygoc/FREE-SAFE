import { UnauthorizedError } from './domain.errors';

export class ForbiddenError extends UnauthorizedError {
  constructor(message = 'Acesso negado para este recurso.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
