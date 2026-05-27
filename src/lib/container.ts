import { CreateAfericaoUseCase } from '@/application/use-cases/afericao/create-afericao.use-case';
import { GetAfericaoByIdUseCase } from '@/application/use-cases/afericao/get-afericao-by-id.use-case';
import { ListAfericoesByPostoUseCase } from '@/application/use-cases/afericao/list-afericoes-by-posto.use-case';
import { GetDashboardKPIsUseCase } from '@/application/use-cases/dashboard/get-dashboard-kpis.use-case';
import { GetCursoByIdUseCase } from '@/application/use-cases/cursos/get-curso-by-id.use-case';
import { GetCursoConteudoUseCase } from '@/application/use-cases/cursos/get-curso-conteudo.use-case';
import { ListCursosUseCase } from '@/application/use-cases/cursos/list-cursos.use-case';
import { CreateRAQUseCase } from '@/application/use-cases/raq/create-raq.use-case';
import { EmitRAQPdfUseCase } from '@/application/use-cases/raq/emit-raq-pdf.use-case';
import { EmitRAQXlsxUseCase } from '@/application/use-cases/raq/emit-raq-xlsx.use-case';
import { GetRAQByIdUseCase } from '@/application/use-cases/raq/get-raq-by-id.use-case';
import { ListRAQByPostoUseCase } from '@/application/use-cases/raq/list-raq-by-posto.use-case';
import { AfericaoPrismaRepository } from '@/infrastructure/database/prisma/repositories/afericao.prisma-repository';
import { ColaboradorPrismaRepository } from '@/infrastructure/database/prisma/repositories/colaborador.prisma-repository';
import { CursoConteudoPrismaRepository } from '@/infrastructure/database/prisma/repositories/curso-conteudo.prisma-repository';
import { CursoPrismaRepository } from '@/infrastructure/database/prisma/repositories/curso.prisma-repository';
import { ProvaAttemptPrismaRepository } from '@/infrastructure/database/prisma/repositories/prova-attempt.prisma-repository';
import { DocumentoPrismaRepository } from '@/infrastructure/database/prisma/repositories/documento.prisma-repository';
import { PostoPrismaRepository } from '@/infrastructure/database/prisma/repositories/posto.prisma-repository';
import { RAQPrismaRepository } from '@/infrastructure/database/prisma/repositories/raq.prisma-repository';
import { ReactPDFAdapter } from '@/infrastructure/pdf/react-pdf.adapter';

export function createRAQUseCase(): CreateRAQUseCase {
  return new CreateRAQUseCase(new RAQPrismaRepository());
}

export function listRAQByPostoUseCase(): ListRAQByPostoUseCase {
  return new ListRAQByPostoUseCase(new RAQPrismaRepository());
}

export function getRAQByIdUseCase(): GetRAQByIdUseCase {
  return new GetRAQByIdUseCase(new RAQPrismaRepository());
}

export function createAfericaoUseCase(): CreateAfericaoUseCase {
  return new CreateAfericaoUseCase(new AfericaoPrismaRepository());
}

export function listAfericoesByPostoUseCase(): ListAfericoesByPostoUseCase {
  return new ListAfericoesByPostoUseCase(new AfericaoPrismaRepository());
}

export function getAfericaoByIdUseCase(): GetAfericaoByIdUseCase {
  return new GetAfericaoByIdUseCase(new AfericaoPrismaRepository());
}

export function emitRAQPdfUseCase(): EmitRAQPdfUseCase {
  return new EmitRAQPdfUseCase(
    new RAQPrismaRepository(),
    new PostoPrismaRepository(),
    new ReactPDFAdapter(),
  );
}

export function emitRAQXlsxUseCase(): EmitRAQXlsxUseCase {
  return new EmitRAQXlsxUseCase(
    new RAQPrismaRepository(),
    new PostoPrismaRepository(),
  );
}

export function getDashboardKPIsUseCase(): GetDashboardKPIsUseCase {
  return new GetDashboardKPIsUseCase(
    new PostoPrismaRepository(),
    new ColaboradorPrismaRepository(),
    new RAQPrismaRepository(),
    new AfericaoPrismaRepository(),
  );
}

export function documentoRepository(): DocumentoPrismaRepository {
  return new DocumentoPrismaRepository();
}

export function listCursosUseCase(): ListCursosUseCase {
  return new ListCursosUseCase(
    new CursoPrismaRepository(),
    new ColaboradorPrismaRepository(),
    new ProvaAttemptPrismaRepository(),
  );
}

export function getCursoByIdUseCase(): GetCursoByIdUseCase {
  return new GetCursoByIdUseCase(
    new CursoPrismaRepository(),
    new ColaboradorPrismaRepository(),
    new ProvaAttemptPrismaRepository(),
  );
}

export function getCursoConteudoUseCase(): GetCursoConteudoUseCase {
  return new GetCursoConteudoUseCase(
    new CursoPrismaRepository(),
    new CursoConteudoPrismaRepository(),
  );
}
