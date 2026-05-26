import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.ativo) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.senhaHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          perfil: user.perfil,
          postoId: user.postoId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nome = user.name ?? undefined;
        token.email = user.email;
        token.perfil = (user as { perfil?: string }).perfil;
        token.postoId = (user as { postoId?: string | null }).postoId ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        name: token.nome as string,
        email: token.email as string,
        perfil: token.perfil as string,
        postoId: (token.postoId as string | null) ?? null,
      };

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
