import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // Rotas públicas
  const publicPaths = [
    '/login',
    '/register',
    '/register-motorista',
    '/forgot-password',
    '/reset-password',
    '/favicon.ico',
    '/api/transportadoras',
  ]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp)$/)

  if (isPublic) return NextResponse.next()


    // Autenticação baseada em cookie/jwt
    const session = request.cookies.get('session')?.value
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Buscar transportadora ou motorista pelo id do cookie
    // Implementar controle de acesso conforme necessário

}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}