import { CreateAfericaoUseCase } from '@/application/use-cases/afericao/create-afericao.use-case';
import { GetAfericaoByIdUseCase } from '@/application/use-cases/afericao/get-afericao-by-id.use-case';
import { ListAfericoesByPostoUseCase } from '@/application/use-cases/afericao/list-afericoes-by-posto.use-case';
import { ListBicosByBombaUseCase } from '@/application/use-cases/bicos/list-bicos-by-bomba.use-case';
import { CreateBicoUseCase } from '@/application/use-cases/bombas/create-bico.use-case';
import { CreateBombaUseCase } from '@/application/use-cases/bombas/create-bomba.use-case';
import { DeleteBicoUseCase } from '@/application/use-cases/bombas/delete-bico.use-case';
import { DeleteBombaUseCase } from '@/application/use-cases/bombas/delete-bomba.use-case';
import { ListBombasByPostoUseCase } from '@/application/use-cases/bombas/list-bombas-by-posto.use-case';
import { UpdateBombaUseCase } from '@/application/use-cases/bombas/update-bomba.use-case';
import { UpdateBicoUseCase } from '@/application/use-cases/bombas/update-bico.use-case';
import { GetDashboardKPIsUseCase } from '@/application/use-cases/dashboard/get-dashboard-kpis.use-case';
import { GetCursoByIdUseCase } from '@/application/use-cases/cursos/get-curso-by-id.use-case';
import { GetCursoConteudoUseCase } from '@/application/use-cases/cursos/get-curso-conteudo.use-case';
import { GetCursoQuestoesUseCase } from '@/application/use-cases/cursos/get-curso-questoes.use-case';
import { GetResultadoProvaUseCase } from '@/application/use-cases/cursos/get-resultado-prova.use-case';
import { ListCursosUseCase } from '@/application/use-cases/cursos/list-cursos.use-case';
import { SubmitProvaUseCase } from '@/application/use-cases/cursos/submit-prova.use-case';
import { CreateRAQUseCase } from '@/application/use-cases/raq/create-raq.use-case';
import { EmitRAQPdfUseCase } from '@/application/use-cases/raq/emit-raq-pdf.use-case';
import { EmitRAQXlsxUseCase } from '@/application/use-cases/raq/emit-raq-xlsx.use-case';
import { GetRAQByIdUseCase } from '@/application/use-cases/raq/get-raq-by-id.use-case';
import { ListRAQByPostoUseCase } from '@/application/use-cases/raq/list-raq-by-posto.use-case';
import { AfericaoPrismaRepository } from '@/infrastructure/database/prisma/repositories/afericao.prisma-repository';
import { BicoPrismaRepository } from '@/infrastructure/database/prisma/repositories/bico.prisma-repository';
import { BombaPrismaRepository } from '@/infrastructure/database/prisma/repositories/bomba.prisma-repository';
import { ColaboradorPrismaRepository } from '@/infrastructure/database/prisma/repositories/colaborador.prisma-repository';
import { CursoConteudoPrismaRepository } from '@/infrastructure/database/prisma/repositories/curso-conteudo.prisma-repository';
import { CursoPrismaRepository } from '@/infrastructure/database/prisma/repositories/curso.prisma-repository';
import { CursoQuestaoPrismaRepository } from '@/infrastructure/database/prisma/repositories/curso-questao.prisma-repository';
import { ProvaAttemptPrismaRepository } from '@/infrastructure/database/prisma/repositories/prova-attempt.prisma-repository';
import { TreinamentoPrismaRepository } from '@/infrastructure/database/prisma/repositories/treinamento.prisma-repository';
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

export function listBombasByPostoUseCase(): ListBombasByPostoUseCase {
  return new ListBombasByPostoUseCase(new BombaPrismaRepository());
}

export function createBombaUseCase(): CreateBombaUseCase {
  return new CreateBombaUseCase(new BombaPrismaRepository());
}

export function createBicoUseCase(): CreateBicoUseCase {
  return new CreateBicoUseCase(
    new BombaPrismaRepository(),
    new BicoPrismaRepository(),
  );
}

export function deleteBicoUseCase(): DeleteBicoUseCase {
  return new DeleteBicoUseCase(
    new BombaPrismaRepository(),
    new BicoPrismaRepository(),
  );
}

export function deleteBombaUseCase(): DeleteBombaUseCase {
  return new DeleteBombaUseCase(
    new BombaPrismaRepository(),
    new BicoPrismaRepository(),
  );
}

export function listBicosByBombaUseCase(): ListBicosByBombaUseCase {
  return new ListBicosByBombaUseCase(
    new BombaPrismaRepository(),
    new BicoPrismaRepository(),
  );
}

export function updateBombaUseCase(): UpdateBombaUseCase {
  return new UpdateBombaUseCase(new BombaPrismaRepository());
}

export function updateBicoUseCase(): UpdateBicoUseCase {
  return new UpdateBicoUseCase(
    new BombaPrismaRepository(),
    new BicoPrismaRepository(),
  );
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

export function getCursoQuestoesUseCase(): GetCursoQuestoesUseCase {
  return new GetCursoQuestoesUseCase(
    new CursoPrismaRepository(),
    new CursoQuestaoPrismaRepository(),
    new ColaboradorPrismaRepository(),
  );
}

export function submitProvaUseCase(): SubmitProvaUseCase {
  return new SubmitProvaUseCase(
    new CursoPrismaRepository(),
    new CursoQuestaoPrismaRepository(),
    new ProvaAttemptPrismaRepository(),
    new ColaboradorPrismaRepository(),
    new TreinamentoPrismaRepository(),
  );
}

export function getResultadoProvaUseCase(): GetResultadoProvaUseCase {
  return new GetResultadoProvaUseCase(
    new CursoPrismaRepository(),
    new ProvaAttemptPrismaRepository(),
    new ColaboradorPrismaRepository(),
  );
}
