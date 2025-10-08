import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

  // Verifica sessão do Supabase
  const { supabase, response } = createClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Buscar dados do usuário no banco para verificar role
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { supabaseUid: user.id },
      include: {
        transportadora: true,
        motorista: true,
      },
    })

    if (!usuario) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Rotas restritas apenas para ADMIN_TRANSPORTADORA
    const adminOnlyPaths = [
      '/transportadoras',
      '/motoristas',
    ]

    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path))

    if (isAdminOnlyPath && usuario.role === 'MOTORISTA') {
      // Redirecionar motorista para viagens
      return NextResponse.redirect(new URL('/viagens', request.url))
    }

    // Se motorista tentar acessar dashboard geral, redirecionar para viagens
    if (pathname === '/dashboard' && usuario.role === 'MOTORISTA') {
      return NextResponse.redirect(new URL('/viagens', request.url))
    }

  } catch (error) {
    console.error('Erro no middleware:', error)
    // Em caso de erro, permitir continuar mas o componente lidará com a verificação
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}