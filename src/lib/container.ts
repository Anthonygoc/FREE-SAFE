import { CreateRAQUseCase } from '@/application/use-cases/raq/create-raq.use-case';
import { ListRAQByPostoUseCase } from '@/application/use-cases/raq/list-raq-by-posto.use-case';
import { RAQPrismaRepository } from '@/infrastructure/database/prisma/repositories/raq.prisma-repository';

export function createRAQUseCase(): CreateRAQUseCase {
  return new CreateRAQUseCase(new RAQPrismaRepository());
}

export function listRAQByPostoUseCase(): ListRAQByPostoUseCase {
  return new ListRAQByPostoUseCase(new RAQPrismaRepository());
}
