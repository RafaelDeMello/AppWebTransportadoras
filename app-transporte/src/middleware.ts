import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Forçar o uso do Node.js runtime ao invés do Edge Runtime
export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  console.log('🟣 [MIDDLEWARE] Verificando rota:', pathname)

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

  if (isPublic) {
    console.log('🟣 [MIDDLEWARE] Rota pública, permitindo acesso')
    return NextResponse.next()
  }

  // Verificar autenticação JWT
  const authToken = request.cookies.get('auth-token')?.value
  console.log('🟣 [MIDDLEWARE] Cookie auth-token:', authToken ? 'PRESENTE' : 'AUSENTE')
  console.log('🟣 [MIDDLEWARE] JWT_SECRET:', JWT_SECRET ? 'DEFINIDA' : 'UNDEFINED')
  
  if (!authToken) {
    console.log('🟣 [MIDDLEWARE] Sem token, redirecionando para login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('🟣 [MIDDLEWARE] Token recebido (primeiros 20 chars):', authToken.substring(0, 20) + '...')

  try {
    // Verificar se o JWT é válido
    const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; role: string }
    console.log('🟣 [MIDDLEWARE] Token decodificado com sucesso:', { userId: decoded.userId, role: decoded.role })
    console.log('🟣 [MIDDLEWARE] Token válido, permitindo acesso')
    return NextResponse.next()
  } catch (error) {
    console.log('🟣 [MIDDLEWARE] Erro ao verificar token:', error instanceof Error ? error.message : error)
    console.log('🟣 [MIDDLEWARE] Token inválido, redirecionando para login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}