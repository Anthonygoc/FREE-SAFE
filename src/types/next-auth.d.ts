import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      perfil: string;
      postoId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    perfil?: string;
    postoId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    nome?: string;
    perfil?: string;
    postoId?: string | null;
  }
}
