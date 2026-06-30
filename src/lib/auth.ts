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
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  providers: [
    Credentials({
      name: 'Credenciais',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(rawCredentials) {
        try {
          console.log('[auth] authorize called');
          const parsed = credentialsSchema.safeParse(rawCredentials);
          if (!parsed.success) {
            console.log('[auth] schema validation failed');
            return null;
          }

          const { email, password } = parsed.data;
          console.log('[auth] looking up user:', email);

          const user = await prisma.user.findUnique({ where: { email } });
          console.log('[auth] user found:', !!user);

          if (!user || !user.ativo) return null;

          const passwordMatches = await bcrypt.compare(password, user.senhaHash);
          console.log('[auth] password matches:', passwordMatches);

          if (!passwordMatches) return null;

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            perfil: user.perfil,
            postoId: user.postoId,
          };
        } catch (error) {
          console.error('[auth] authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.nome = user.name ?? undefined;
        token.email = user.email;
        token.perfil = (user as { perfil?: string }).perfil;
        token.postoId = (user as { postoId?: string | null }).postoId ?? null;
      }

      if (trigger === 'update' && session) {
        if (typeof session.name === 'string') {
          token.nome = session.name;
        }

        if (typeof session.email === 'string') {
          token.email = session.email;
        }
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
  pages: { signIn: '/login' },
});
