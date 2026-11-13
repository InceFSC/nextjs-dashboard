import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth; //session

export const config = {         //config
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

//session+config looks like Middleware
//function auth(request:NextRequest): Response
//config+matcher
